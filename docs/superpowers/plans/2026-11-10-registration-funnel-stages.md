# Registration funnel stages

Spec: `docs/superpowers/specs/2026-11-10-registration-funnel-stages-design.md`

1. Pure `registrationFunnelStage` plus tests for a fee lead and a zero-fee lead.
2. Replace inbox chips and the list filter with the five stages. Default is `registered`.
3. Add `enrollment_fee_mail_sent_at`. Stamp it when staff send the matrícula mail.
4. Mark contacted creates the student only when there is no matrícula.
5. One actions panel on web and on the narrow list. Cuota al ingresar only on the section stage. Drop the matrícula sentence from that legend.
