import {
  startChangeBillingCurrencyTour,
  startEnableFlowTour,
  startEnableMercadoPagoTour,
} from "@/lib/admin-tutorials/client/startFinanceSettingsTours";
import { startCreateBlogArticleTour } from "@/lib/admin-tutorials/client/startCreateBlogArticleTour";
import { startResetUserPasswordTour } from "@/lib/admin-tutorials/client/startResetUserPasswordTour";
import { startImportUsersTour } from "@/lib/admin-tutorials/client/startImportUsersTour";
import { startApproveEventPaymentTour } from "@/lib/admin-tutorials/client/startApproveEventPaymentTour";
import { startAssignSectionScholarshipBulkTour } from "@/lib/admin-tutorials/client/startAssignSectionScholarshipBulkTour";
import { startChangeSiteSetupCurrencyTour } from "@/lib/admin-tutorials/client/startChangeSiteSetupCurrencyTour";
import { startCreateBlogArticleAsTeacherTour } from "@/lib/admin-tutorials/client/startCreateBlogArticleAsTeacherTour";
import {
  toChangeBillingCurrencyCopy,
  toCreateBlogArticleCopy,
  toEnableFlowCopy,
  toEnableMercadoPagoCopy,
  toImportUsersCopy,
  toResetUserPasswordCopy,
  toApproveEventPaymentCopy,
  toAssignSectionScholarshipBulkCopy,
  toChangeSiteSetupCurrencyCopy,
  toCreateBlogArticleAsTeacherCopy,
} from "@/lib/admin-tutorials/client/mapOperationalTaskTourCopy";
import type { StartAdminTutorialInput } from "@/lib/admin-tutorials/client/startAdminTutorialTypes";

/** Operational catalog tutorials (finance settings → import). Returns true when handled. */
export async function startAdminTutorialOperational(
  input: StartAdminTutorialInput,
): Promise<boolean> {
  switch (input.id) {
    case "enable-mercadopago":
      await startEnableMercadoPagoTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toEnableMercadoPagoCopy(input.toursDict.enableMercadoPago),
        push: input.push,
      });
      return true;
    case "enable-flow":
      await startEnableFlowTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toEnableFlowCopy(input.toursDict.enableFlow),
        push: input.push,
      });
      return true;
    case "change-billing-currency":
      await startChangeBillingCurrencyTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toChangeBillingCurrencyCopy(input.toursDict.changeBillingCurrency),
        push: input.push,
      });
      return true;
    case "approve-event-payment":
      await startApproveEventPaymentTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toApproveEventPaymentCopy(input.toursDict.approveEventPayment),
        push: input.push,
      });
      return true;
    case "assign-section-scholarship-bulk":
      await startAssignSectionScholarshipBulkTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toAssignSectionScholarshipBulkCopy(
          input.toursDict.assignSectionScholarshipBulk,
        ),
        push: input.push,
      });
      return true;
    case "change-site-setup-currency":
      await startChangeSiteSetupCurrencyTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toChangeSiteSetupCurrencyCopy(input.toursDict.changeSiteSetupCurrency),
        push: input.push,
      });
      return true;
    case "create-blog-article":
      await startCreateBlogArticleTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateBlogArticleCopy(input.toursDict.createBlogArticle),
        push: input.push,
      });
      return true;
    case "create-blog-article-as-teacher":
      await startCreateBlogArticleAsTeacherTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateBlogArticleAsTeacherCopy(
          input.toursDict.createBlogArticleAsTeacher,
        ),
        push: input.push,
      });
      return true;
    case "reset-user-password":
      await startResetUserPasswordTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toResetUserPasswordCopy(input.toursDict.resetUserPassword),
        push: input.push,
      });
      return true;
    case "import-users":
      await startImportUsersTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toImportUsersCopy(input.toursDict.importUsers),
        push: input.push,
      });
      return true;
    default:
      return false;
  }
}
