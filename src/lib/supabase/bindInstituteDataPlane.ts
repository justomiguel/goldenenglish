import {
  instituteAuthEmail,
  instituteStoragePath,
} from "@/lib/tenant/instituteAuthEmail";

type SchemaTenant = {
  dataMode?: string | null;
  postgresSchema?: string | null;
};

type AuthUserWrite = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function sharedSchema(tenant: SchemaTenant | null | undefined): string | null {
  if (tenant?.dataMode !== "shared_schema") return null;
  const schema = tenant.postgresSchema?.trim() ?? "";
  if (!schema || schema === "public") return null;
  return schema;
}

function withAuthIdentity<T extends AuthUserWrite>(input: T, schema: string): T {
  if (!input.email) return input;
  const visible = input.email.trim().toLowerCase();
  return {
    ...input,
    email: instituteAuthEmail(visible, schema),
    user_metadata: {
      ...input.user_metadata,
      visible_email: visible,
      tenant_schema: schema,
    },
  };
}

function bindStorage(
  storage: { from: (bucket: string) => Record<string, unknown> },
  schema: string,
) {
  return new Proxy(storage, {
    get(target, prop, receiver) {
      if (prop !== "from") return Reflect.get(target, prop, receiver);
      return (bucket: string) => {
        const api = target.from(bucket) as Record<string, unknown>;
        return new Proxy(api, {
          get(bucketTarget, bucketProp, bucketReceiver) {
            const value = Reflect.get(bucketTarget, bucketProp, bucketReceiver);
            if (typeof value !== "function") return value;
            const call = value as (...fnArgs: unknown[]) => unknown;
            const name = String(bucketProp);
            return (...args: unknown[]) => {
              if (name === "remove" || name === "createSignedUrls") {
                const paths = Array.isArray(args[0]) ? args[0] : [];
                args[0] = paths.map((path) =>
                  typeof path === "string" ? instituteStoragePath(schema, path) : path,
                );
              } else if (
                name === "upload" ||
                name === "download" ||
                name === "list" ||
                name === "move" ||
                name === "copy" ||
                name === "createSignedUrl" ||
                name === "getPublicUrl"
              ) {
                if (typeof args[0] === "string") {
                  args[0] = instituteStoragePath(schema, args[0]);
                }
                if ((name === "move" || name === "copy") && typeof args[1] === "string") {
                  args[1] = instituteStoragePath(schema, args[1]);
                }
              }
              return call.apply(bucketTarget, args);
            };
          },
        });
      };
    },
  });
}

function bindAuth(auth: { admin?: object }, schema: string) {
  return new Proxy(auth, {
    get(target, prop, receiver) {
      if (prop === "admin" && target.admin) {
        const admin = target.admin as {
          createUser?: (input: AuthUserWrite) => unknown;
          updateUserById?: (id: string, input: AuthUserWrite) => unknown;
        };
        return new Proxy(admin, {
          get(adminTarget, adminProp, adminReceiver) {
            if (adminProp === "createUser") {
              return (input: AuthUserWrite) =>
                adminTarget.createUser?.call(adminTarget, withAuthIdentity(input, schema));
            }
            if (adminProp === "updateUserById") {
              return (id: string, input: AuthUserWrite) =>
                adminTarget.updateUserById?.call(
                  adminTarget,
                  id,
                  input?.email ? withAuthIdentity(input, schema) : input,
                );
            }
            return Reflect.get(adminTarget, adminProp, adminReceiver);
          },
        });
      }
      if (prop === "signInWithPassword") {
        const fn = Reflect.get(target, prop, receiver) as (
          input: { email?: string },
        ) => unknown;
        return (input: { email?: string }) =>
          fn.call(
            target,
            input?.email
              ? { ...input, email: instituteAuthEmail(input.email, schema) }
              : input,
          );
      }
      if (prop === "signUp") {
        const fn = Reflect.get(target, prop, receiver) as (input: AuthUserWrite) => unknown;
        return (input: AuthUserWrite) =>
          fn.call(target, input?.email ? withAuthIdentity(input, schema) : input);
      }
      if (prop === "resetPasswordForEmail") {
        const fn = Reflect.get(target, prop, receiver) as (
          email: string,
          options?: unknown,
        ) => unknown;
        return (email: string, options?: unknown) =>
          fn.call(target, instituteAuthEmail(email, schema), options);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/** PostgREST `.from` / `.rpc` and storage keys follow the institute schema. */
export function bindInstituteDataPlane<T extends object>(
  client: T,
  tenant: SchemaTenant | null | undefined,
): T {
  const schema = sharedSchema(tenant);
  if (!schema) return client;
  const scoped = client as T & {
    schema: (name: string) => {
      from: (table: string) => unknown;
      rpc: (fn: string, args?: unknown) => unknown;
    };
    storage?: { from: (bucket: string) => Record<string, unknown> };
    auth?: object;
  };
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from" || prop === "rpc") {
        const api = scoped.schema(schema);
        const fn = api[prop as "from"];
        return fn.bind(api);
      }
      if (prop === "storage" && scoped.storage) return bindStorage(scoped.storage, schema);
      if (prop === "auth" && scoped.auth) return bindAuth(scoped.auth as never, schema);
      return Reflect.get(target, prop, receiver);
    },
  });
}
