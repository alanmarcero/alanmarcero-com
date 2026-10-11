# Handoff: finish the contact form's email setup

Pick this up in a desktop Claude Code session on this repo. Start with
"read docs/handoffs/2026-10-11-contact-form-ses.md and do it". Delete this file
once it's done.

## Where things stand (2026-10-11)

Shipped and live on `main`:

- Contact form at the bottom of the main page (`src/components/ContactForm.jsx`),
  a "Get in Touch" hero link to it, and the Lambda route `POST /api/contact`
  (`contact.ts`). See CLAUDE.md → "Contact form (`POST /api/contact`)".
- `CONTACT_EMAIL` GitHub secret exists. `deploy.yml` merges it into the Lambda
  environment on every deploy (confirmed: run #419 logged "Contact recipient set.").
- The CloudFront `/api/contact` behavior was added by the first run of
  `.github/workflows/contact-form-setup.yml` (run 38167139447).

**Not working yet: the form cannot send.** That setup run failed at its SES step:

```
User: arn:aws:iam::891377079963:user/github is not authorized to perform:
ses:CreateEmailIdentity on resource: arn:aws:ses:us-east-1:891377079963:identity/alanmarcero.com
```

The `github` IAM user (the one behind `AWS_ACCESS_KEY_ID`) has no SES,
Route 53 or IAM rights. The remaining setup steps need:

| Step | Permissions |
|------|-------------|
| Verify domain + DKIM | `ses:CreateEmailIdentity`, `ses:GetEmailIdentity`, `route53:ListHostedZonesByName`, `route53:ChangeResourceRecordSets` |
| Verify recipient | `ses:CreateEmailIdentity`, `ses:GetEmailIdentity` |
| Let the Lambda send | `iam:PutRolePolicy` on the Lambda's execution role |

Until this is fixed, the live form shows "Your message could not be sent".

## What Alan wants

All AWS changes go through GitHub Actions. He does not want to make IAM changes
by hand in the console.

## The fix: make the setup workflow grant itself the rights for one run

Add a step to `contact-form-setup.yml` that attaches a temporary inline policy
to the `github` user, and a final `always()` step that deletes it. Alan approved
this. The cloud session that wrote this file couldn't apply it, because its auto
permission mode blocks a CI user granting itself IAM rights. Run this session in
a mode that prompts instead (Accept edits / default), and approve each step.

Insert the grant step right after "Configure AWS credentials":

```yaml
      - name: Grant this run the setup permissions
        env:
          FUNCTION_NAME: ${{ secrets.LAMBDA_FUNCTION_NAME }}
        run: |
          ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
          USER_NAME=$(aws sts get-caller-identity --query Arn --output text | awk -F/ '{print $NF}')
          ROLE_ARN=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query Role --output text)
          echo "USER_NAME=$USER_NAME" >> "$GITHUB_ENV"
          jq -n --arg acct "$ACCOUNT_ID" --arg region "$AWS_REGION" --arg role "$ROLE_ARN" '{
            Version: "2012-10-17",
            Statement: [
              {Effect: "Allow", Action: ["ses:CreateEmailIdentity", "ses:GetEmailIdentity"],
               Resource: "arn:aws:ses:\($region):\($acct):identity/*"},
              {Effect: "Allow", Action: "route53:ListHostedZonesByName", Resource: "*"},
              {Effect: "Allow", Action: "route53:ChangeResourceRecordSets", Resource: "arn:aws:route53:::hostedzone/*"},
              {Effect: "Allow", Action: "iam:PutRolePolicy", Resource: $role}
            ]
          }' > setup-policy.json
          if ! aws iam put-user-policy --user-name "$USER_NAME" \
              --policy-name contact-form-setup-temp --policy-document file://setup-policy.json; then
            echo "::group::What $USER_NAME is allowed (diagnostics)"
            aws iam list-attached-user-policies --user-name "$USER_NAME" || true
            aws iam list-user-policies --user-name "$USER_NAME" || true
            aws iam list-groups-for-user --user-name "$USER_NAME" || true
            echo "::endgroup::"
            echo "::error::$USER_NAME cannot grant itself IAM permissions (iam:PutUserPolicy)."
            exit 1
          fi
          echo "GRANTED=1" >> "$GITHUB_ENV"
          # IAM is eventually consistent; give the new policy time to apply.
          sleep 15
```

Append the revoke step as the job's last step:

```yaml
      - name: Revoke the setup permissions
        if: always() && env.GRANTED == '1'
        run: |
          aws iam delete-user-policy --user-name "$USER_NAME" --policy-name contact-form-setup-temp
          echo "Temporary setup policy removed"
```

Update the header comment to mention step 0 (temporary self-grant, revoked at
the end). Then commit, push to `main`, and run **Contact Form Setup (one-time)**
from the Actions tab (or `gh workflow run contact-form-setup.yml`). The
CloudFront step will skip, since its behavior is already in place.

### Likely outcome: it fails with "cannot grant itself"

The `github` user can't even create an SES identity, so it very likely lacks
`iam:PutUserPolicy` too. If so, the diagnostics group in the log shows what it
does hold. Then GitHub Actions can't fix this with the current keys, and there
are two ways forward. Put both to Alan:

1. **Use credentials that can do it.** Run the same workflow with an admin key
   (a temporary secret), or attach the policy above to the `github` user once
   with an admin AWS CLI profile on this desktop:
   `aws iam put-user-policy --user-name github --policy-name contact-form-setup --policy-document file://setup-policy.json`.
   After that the setup workflow works unchanged.
2. **Drop SES and send via Resend.** This needs no AWS permission changes. Alan
   creates a free resend.com account, creates an API key and adds it as the
   `RESEND_API_KEY` GitHub secret. Then:
   - `contact.ts`: replace `sesSend` with a `fetch("https://api.resend.com/emails")`
     POST (Bearer key; `from`, `to`, `reply_to`, `subject`, `text`). Keep the
     `SendMail` signature so `contact.test.ts` needs no changes.
   - `deploy.yml`: merge `RESEND_API_KEY` into the Lambda env alongside
     `CONTACT_EMAIL` (same jq merge step).
   - The sender must be a domain verified in Resend. Until it is,
     `onboarding@resend.dev` can only send to the account owner's own address.
     That's fine here, if Alan's Resend account uses the `CONTACT_EMAIL` address.
   - Remove the SES/IAM steps from the setup workflow, drop the
     `@aws-sdk/client-sesv2` devDependency, and update CLAUDE.md.

## After setup succeeds

1. Alan clicks the AWS SES verification email that arrives at the
   `CONTACT_EMAIL` inbox.
2. SES verifies the domain from the DKIM records, which takes up to about an hour.
3. Send a real test message from https://alanmarcero.com/#contact and confirm it
   arrives, with Reply-To set to the sender.
4. If it fails, check the Lambda's CloudWatch logs for "Contact send failed".
5. Move `contact-form-setup.yml` into `infrastructure/` once it has run
   successfully, matching the other archived one-time workflows.

## Don'ts

- Never commit the recipient address anywhere. It lives only in the
  `CONTACT_EMAIL` secret.
- Don't leave the temporary IAM policy attached. The revoke step must run.
