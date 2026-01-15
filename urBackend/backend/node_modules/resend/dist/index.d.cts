import * as React$1 from "react";

//#region src/api-keys/interfaces/api-key.d.ts
interface ApiKey {
  created_at: string;
  id: string;
  name: string;
}
//#endregion
//#region src/domains/interfaces/domain.d.ts
type DomainRegion = 'us-east-1' | 'eu-west-1' | 'sa-east-1' | 'ap-northeast-1';
type DomainCapabilityStatus = 'enabled' | 'disabled';
interface DomainCapabilities {
  sending: DomainCapabilityStatus;
  receiving: DomainCapabilityStatus;
}
type DomainNameservers = 'Amazon Route 53' | 'Cloudflare' | 'Digital Ocean' | 'GoDaddy' | 'Google Domains' | 'Namecheap' | 'Unidentified' | 'Vercel';
type DomainStatus = 'pending' | 'verified' | 'failed' | 'temporary_failure' | 'not_started';
type DomainRecords = DomainSpfRecord | DomainDkimRecord | ReceivingRecord;
interface DomainSpfRecord {
  record: 'SPF';
  name: string;
  value: string;
  type: 'MX' | 'TXT';
  ttl: string;
  status: DomainStatus;
  routing_policy?: string;
  priority?: number;
  proxy_status?: 'enable' | 'disable';
}
interface DomainDkimRecord {
  record: 'DKIM';
  name: string;
  value: string;
  type: 'CNAME' | 'TXT';
  ttl: string;
  status: DomainStatus;
  routing_policy?: string;
  priority?: number;
  proxy_status?: 'enable' | 'disable';
}
interface ReceivingRecord {
  record: 'Receiving';
  name: string;
  value: string;
  type: 'MX';
  ttl: string;
  status: DomainStatus;
  priority: number;
}
interface Domain {
  id: string;
  name: string;
  status: DomainStatus;
  created_at: string;
  region: DomainRegion;
  capabilities: DomainCapabilities;
}
//#endregion
//#region src/common/interfaces/domain-api-options.interface.d.ts
interface DomainApiOptions {
  name: string;
  region?: string;
  custom_return_path?: string;
  capabilities?: Partial<DomainCapabilities>;
  open_tracking?: boolean;
  click_tracking?: boolean;
  tls?: 'enforced' | 'opportunistic';
}
//#endregion
//#region src/interfaces.d.ts
type RESEND_ERROR_CODE_KEY = 'invalid_idempotency_key' | 'validation_error' | 'missing_api_key' | 'restricted_api_key' | 'invalid_api_key' | 'not_found' | 'method_not_allowed' | 'invalid_idempotent_request' | 'concurrent_idempotent_requests' | 'invalid_attachment' | 'invalid_from_address' | 'invalid_access' | 'invalid_parameter' | 'invalid_region' | 'missing_required_field' | 'monthly_quota_exceeded' | 'daily_quota_exceeded' | 'rate_limit_exceeded' | 'security_error' | 'application_error' | 'internal_server_error';
type Response<T> = ({
  data: T;
  error: null;
} | {
  error: ErrorResponse;
  data: null;
}) & {
  headers: Record<string, string> | null;
};
type ErrorResponse = {
  message: string;
  statusCode: number | null;
  name: RESEND_ERROR_CODE_KEY;
};
type Tag$1 = {
  name: string;
  value: string;
};
//#endregion
//#region src/common/interfaces/email-api-options.interface.d.ts
interface EmailApiAttachment {
  content?: string | Buffer;
  filename?: string | false | undefined;
  path?: string;
  content_type?: string;
  content_id?: string;
}
interface EmailApiOptions {
  from?: string;
  to: string | string[];
  subject?: string;
  region?: string;
  headers?: Record<string, string>;
  html?: string;
  text?: string;
  bcc?: string | string[];
  cc?: string | string[];
  reply_to?: string | string[];
  topic_id?: string | null;
  scheduled_at?: string;
  tags?: Tag$1[];
  attachments?: EmailApiAttachment[];
  template?: {
    id: string;
    variables?: Record<string, string | number>;
  };
}
//#endregion
//#region src/common/interfaces/get-option.interface.d.ts
interface GetOptions {
  query?: Record<string, unknown>;
  headers?: HeadersInit;
}
//#endregion
//#region src/common/interfaces/idempotent-request.interface.d.ts
interface IdempotentRequest {
  /**
   * Unique key that ensures the same operation is not processed multiple times.
   * Allows for safe retries without duplicating operations.
   * If provided, will be sent as the `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}
//#endregion
//#region src/common/interfaces/pagination-options.interface.d.ts
type PaginationOptions = {
  /**
   * Maximum number of items to return (1-100, default: 20)
   */
  limit?: number;
} & ({
  /**
   * Get items after this cursor (cannot be used with 'before')
   */
  after?: string;
  before?: never;
} | {
  /**
   * Get items before this cursor (cannot be used with 'after')
   */
  before?: string;
  after?: never;
});
type PaginatedData<Data> = {
  object: 'list';
  data: Data;
  has_more: boolean;
};
//#endregion
//#region src/common/interfaces/patch-option.interface.d.ts
interface PatchOptions {
  query?: {
    [key: string]: unknown;
  };
  headers?: HeadersInit;
}
//#endregion
//#region src/common/interfaces/post-option.interface.d.ts
interface PostOptions {
  query?: {
    [key: string]: unknown;
  };
  headers?: HeadersInit;
}
//#endregion
//#region src/common/interfaces/put-option.interface.d.ts
interface PutOptions {
  query?: {
    [key: string]: unknown;
  };
  headers?: HeadersInit;
}
//#endregion
//#region src/common/interfaces/require-at-least-one.d.ts
type RequireAtLeastOne<T> = { [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>> }[keyof T];
//#endregion
//#region src/api-keys/interfaces/create-api-key-options.interface.d.ts
interface CreateApiKeyOptions {
  name: string;
  permission?: 'full_access' | 'sending_access';
  domain_id?: string;
}
interface CreateApiKeyRequestOptions extends PostOptions {}
interface CreateApiKeyResponseSuccess {
  token: string;
  id: string;
}
type CreateApiKeyResponse = Response<CreateApiKeyResponseSuccess>;
//#endregion
//#region src/api-keys/interfaces/list-api-keys.interface.d.ts
type ListApiKeysOptions = PaginationOptions;
type ListApiKeysResponseSuccess = {
  object: 'list';
  has_more: boolean;
  data: Pick<ApiKey, 'name' | 'id' | 'created_at'>[];
};
type ListApiKeysResponse = Response<ListApiKeysResponseSuccess>;
//#endregion
//#region src/api-keys/interfaces/remove-api-keys.interface.d.ts
type RemoveApiKeyResponseSuccess = {};
type RemoveApiKeyResponse = Response<RemoveApiKeyResponseSuccess>;
//#endregion
//#region src/emails/interfaces/create-email-options.interface.d.ts
interface EmailRenderOptions$1 {
  /**
   * The React component used to write the message.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  react: React$1.ReactNode;
  /**
   * The HTML version of the message.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  html: string;
  /**
   * The plain text version of the message.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  text: string;
}
interface EmailTemplateOptions {
  template: {
    id: string;
    variables?: Record<string, string | number>;
  };
}
interface CreateEmailBaseOptionsWithTemplate extends Omit<CreateEmailBaseOptions, 'from' | 'subject'> {
  from?: string;
  subject?: string;
}
interface CreateEmailBaseOptions {
  /**
   * Filename and content of attachments (max 40mb per email)
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  attachments?: Attachment[];
  /**
   * Blind carbon copy recipient email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  bcc?: string | string[];
  /**
   * Carbon copy recipient email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  cc?: string | string[];
  /**
   * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  from: string;
  /**
   * Custom headers to add to the email.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  headers?: Record<string, string>;
  /**
   * Reply-to email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  replyTo?: string | string[];
  /**
   * Email subject.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  subject: string;
  /**
   * Email tags
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  tags?: Tag[];
  /**
   * Recipient email address. For multiple addresses, send as an array of strings. Max 50.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  to: string | string[];
  /**
   * The id of the topic you want to send to
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  topicId?: string | null;
  /**
   * Schedule email to be sent later.
   * The date should be in ISO 8601 format (e.g: 2024-08-05T11:52:01.858Z).
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  scheduledAt?: string;
}
type CreateEmailOptions = ((RequireAtLeastOne<EmailRenderOptions$1> & CreateEmailBaseOptions) & {
  template?: never;
}) | ((EmailTemplateOptions & CreateEmailBaseOptionsWithTemplate) & {
  react?: never;
  html?: never;
  text?: never;
});
interface CreateEmailRequestOptions extends PostOptions, IdempotentRequest {}
interface CreateEmailResponseSuccess {
  /** The ID of the newly created email. */
  id: string;
}
type CreateEmailResponse = Response<CreateEmailResponseSuccess>;
interface Attachment {
  /** Content of an attached file. */
  content?: string | Buffer;
  /** Name of attached file. */
  filename?: string | false | undefined;
  /** Path where the attachment file is hosted */
  path?: string;
  /** Optional content type for the attachment, if not set will be derived from the filename property */
  contentType?: string;
  /**
   * Optional content ID for the attachment, to be used as a reference in the HTML content.
   * If set, this attachment will be sent as an inline attachment and you can reference it in the HTML content using the `cid:` prefix.
   */
  contentId?: string;
}
type Tag = {
  /**
   * The name of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
   */
  name: string;
  /**
   * The value of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
   */
  value: string;
};
//#endregion
//#region src/batch/interfaces/create-batch-options.interface.d.ts
type CreateBatchOptions = CreateEmailOptions[];
interface CreateBatchRequestOptions extends PostOptions, IdempotentRequest {
  /**
   * @default 'strict'
   */
  batchValidation?: 'strict' | 'permissive';
}
type CreateBatchSuccessResponse<Options extends CreateBatchRequestOptions = CreateBatchRequestOptions> = {
  data: {
    /** The ID of the newly created email. */
    id: string;
  }[];
} & (Options['batchValidation'] extends 'permissive' ? {
  /**
   * Only present when header "x-batch-validation" is set to 'permissive'.
   */
  errors: {
    /**
     * The index of the failed email in the batch
     */
    index: number;
    /**
     * The error message for the failed email
     */
    message: string;
  }[];
} : Record<string, never>);
type CreateBatchResponse<Options extends CreateBatchRequestOptions> = Response<CreateBatchSuccessResponse<Options>>;
//#endregion
//#region src/broadcasts/interfaces/broadcast.d.ts
interface Broadcast {
  id: string;
  name: string;
  segment_id: string | null;
  audience_id: string | null;
  from: string | null;
  subject: string | null;
  reply_to: string[] | null;
  preview_text: string | null;
  status: 'draft' | 'sent' | 'queued';
  created_at: string;
  scheduled_at: string | null;
  sent_at: string | null;
  topic_id?: string | null;
  html: string | null;
  text: string | null;
}
//#endregion
//#region src/broadcasts/interfaces/create-broadcast-options.interface.d.ts
interface EmailRenderOptions {
  /**
   * The React component used to write the message.
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  react: React$1.ReactNode;
  /**
   * The HTML version of the message.
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  html: string;
  /**
   * The plain text version of the message.
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  text: string;
}
interface SegmentOptions {
  /**
   * The id of the segment you want to send to
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  segmentId: string;
  /**
   * @deprecated Use segmentId instead
   */
  audienceId: string;
}
interface CreateBroadcastBaseOptions {
  /**
   * The name of the broadcast
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  name?: string;
  /**
   * A short snippet of text displayed as a preview in recipients' inboxes, often shown below or beside the subject line.
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  previewText?: string;
  /**
   * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  from: string;
  /**
   * Reply-to email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  replyTo?: string | string[];
  /**
   * Email subject.
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  subject: string;
  /**
   * The id of the topic you want to send to
   *
   * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
   */
  topicId?: string | null;
}
type CreateBroadcastOptions = RequireAtLeastOne<EmailRenderOptions> & RequireAtLeastOne<SegmentOptions> & CreateBroadcastBaseOptions;
interface CreateBroadcastRequestOptions extends PostOptions {}
interface CreateBroadcastResponseSuccess {
  /** The ID of the newly sent broadcasts. */
  id: string;
}
type CreateBroadcastResponse = Response<CreateBroadcastResponseSuccess>;
//#endregion
//#region src/broadcasts/interfaces/get-broadcast.interface.d.ts
interface GetBroadcastResponseSuccess extends Broadcast {
  object: 'broadcast';
}
type GetBroadcastResponse = Response<GetBroadcastResponseSuccess>;
//#endregion
//#region src/broadcasts/interfaces/list-broadcasts.interface.d.ts
type ListBroadcastsOptions = PaginationOptions;
type ListBroadcastsResponseSuccess = {
  object: 'list';
  has_more: boolean;
  data: Pick<Broadcast, 'id' | 'name' | 'audience_id' | 'segment_id' | 'status' | 'created_at' | 'scheduled_at' | 'sent_at'>[];
};
type ListBroadcastsResponse = Response<ListBroadcastsResponseSuccess>;
//#endregion
//#region src/broadcasts/interfaces/remove-broadcast.interface.d.ts
interface RemoveBroadcastResponseSuccess extends Pick<Broadcast, 'id'> {
  object: 'broadcast';
  deleted: boolean;
}
type RemoveBroadcastResponse = Response<RemoveBroadcastResponseSuccess>;
//#endregion
//#region src/broadcasts/interfaces/send-broadcast-options.interface.d.ts
interface SendBroadcastBaseOptions {
  /**
   * Schedule email to be sent later.
   * The date should be in ISO 8601 format (e.g: 2024-08-05T11:52:01.858Z)
   * or relative time (eg: in 2 days).
   *
   * @link https://resend.com/docs/api-reference/broadcasts/send#body-parameters
   */
  scheduledAt?: string;
}
type SendBroadcastOptions = SendBroadcastBaseOptions;
interface SendBroadcastRequestOptions extends PostOptions {}
interface SendBroadcastResponseSuccess {
  /** The ID of the sent broadcast. */
  id: string;
}
type SendBroadcastResponse = Response<SendBroadcastResponseSuccess>;
//#endregion
//#region src/broadcasts/interfaces/update-broadcast.interface.d.ts
interface UpdateBroadcastResponseSuccess {
  id: string;
}
type UpdateBroadcastOptions = {
  name?: string;
  segmentId?: string;
  /**
   * @deprecated Use segmentId instead
   */
  audienceId?: string;
  from?: string;
  html?: string;
  react?: React.ReactNode;
  text?: string;
  subject?: string;
  replyTo?: string[];
  previewText?: string;
  topicId?: string | null;
};
type UpdateBroadcastResponse = Response<UpdateBroadcastResponseSuccess>;
//#endregion
//#region src/contacts/interfaces/contact.d.ts
interface Contact {
  created_at: string;
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  unsubscribed: boolean;
}
type SelectingField = {
  /**
   * The contact id.
   *
   * @link https://resend.com/docs/api-reference/contacts/delete-contact#body-parameters
   */
  id: string;
  /**
   * The contact email.
   *
   * @link https://resend.com/docs/api-reference/contacts/delete-contact#body-parameters
   */
  email?: undefined | null;
} | {
  /**
   * The contact id.
   *
   * @link https://resend.com/docs/api-reference/contacts/delete-contact#body-parameters
   */
  id?: undefined | null;
  /**
   * The contact email.
   *
   * @link https://resend.com/docs/api-reference/contacts/delete-contact#body-parameters
   */
  email: string;
};
//#endregion
//#region src/contacts/interfaces/create-contact-options.interface.d.ts
interface CreateContactPropertiesOptions {
  [key: string]: string | number | null;
}
interface CreateContactOptions {
  audienceId?: string;
  email: string;
  unsubscribed?: boolean;
  firstName?: string;
  lastName?: string;
  properties?: CreateContactPropertiesOptions;
}
interface CreateContactRequestOptions extends PostOptions {}
interface CreateContactResponseSuccess extends Pick<Contact, 'id'> {
  object: 'contact';
}
type CreateContactResponse = Response<CreateContactResponseSuccess>;
//#endregion
//#region src/contacts/interfaces/get-contact.interface.d.ts
type GetContactOptions = string | ({
  audienceId?: string;
} & SelectingField);
type ContactPropertyValue = {
  type: 'string';
  value: string;
} | {
  type: 'number';
  value: number;
};
interface ContactProperties$1 {
  [key: string]: ContactPropertyValue;
}
interface GetContactResponseSuccess extends Pick<Contact, 'id' | 'email' | 'created_at' | 'first_name' | 'last_name' | 'unsubscribed'> {
  object: 'contact';
  properties: ContactProperties$1;
}
type GetContactResponse = Response<GetContactResponseSuccess>;
//#endregion
//#region src/contacts/interfaces/list-contacts.interface.d.ts
type ListContactsOptions = PaginationOptions & {
  segmentId?: string;
  /**
   * @deprecated Use segmentId instead to filter by segment
   */
  audienceId?: string;
};
interface ListContactsResponseSuccess {
  object: 'list';
  data: Contact[];
  has_more: boolean;
}
type ListContactsResponse = Response<ListContactsResponseSuccess>;
//#endregion
//#region src/contacts/interfaces/remove-contact.interface.d.ts
type RemoveContactsResponseSuccess = {
  object: 'contact';
  deleted: boolean;
  contact: string;
};
type RemoveContactOptions = string | (SelectingField & {
  audienceId?: string;
});
type RemoveContactsResponse = Response<RemoveContactsResponseSuccess>;
//#endregion
//#region src/contacts/interfaces/update-contact.interface.d.ts
interface UpdateContactPropertiesOptions {
  [key: string]: string | number | null;
}
type UpdateContactOptions = {
  audienceId?: string;
  unsubscribed?: boolean;
  /**
   * Use `null` to clear the `firstName`
   */
  firstName?: string | null;
  /**
   * Use `null` to clear the `lastName`
   */
  lastName?: string | null;
  properties?: UpdateContactPropertiesOptions;
} & SelectingField;
type UpdateContactResponseSuccess = Pick<Contact, 'id'> & {
  object: 'contact';
};
type UpdateContactResponse = Response<UpdateContactResponseSuccess>;
//#endregion
//#region src/domains/interfaces/create-domain-options.interface.d.ts
interface CreateDomainOptions {
  name: string;
  region?: DomainRegion;
  customReturnPath?: string;
  capabilities?: Partial<DomainCapabilities>;
  openTracking?: boolean;
  clickTracking?: boolean;
  tls?: 'enforced' | 'opportunistic';
}
interface CreateDomainRequestOptions extends PostOptions {}
interface CreateDomainResponseSuccess extends Pick<Domain, 'name' | 'id' | 'status' | 'created_at' | 'region'> {
  records: DomainRecords[];
  capabilities: DomainCapabilities;
}
type CreateDomainResponse = Response<CreateDomainResponseSuccess>;
//#endregion
//#region src/domains/interfaces/get-domain.interface.d.ts
interface GetDomainResponseSuccess extends Pick<Domain, 'id' | 'name' | 'created_at' | 'region' | 'status' | 'capabilities'> {
  object: 'domain';
  records: DomainRecords[];
}
type GetDomainResponse = Response<GetDomainResponseSuccess>;
//#endregion
//#region src/domains/interfaces/list-domains.interface.d.ts
type ListDomainsOptions = PaginationOptions;
type ListDomainsResponseSuccess = {
  data: Domain[];
  object: 'list';
  has_more: boolean;
};
type ListDomainsResponse = Response<ListDomainsResponseSuccess>;
//#endregion
//#region src/domains/interfaces/remove-domain.interface.d.ts
type RemoveDomainsResponseSuccess = Pick<Domain, 'id'> & {
  object: 'domain';
  deleted: boolean;
};
type RemoveDomainsResponse = Response<RemoveDomainsResponseSuccess>;
//#endregion
//#region src/domains/interfaces/update-domain.interface.d.ts
interface UpdateDomainsOptions {
  id: string;
  clickTracking?: boolean;
  openTracking?: boolean;
  tls?: 'enforced' | 'opportunistic';
  capabilities?: Partial<DomainCapabilities>;
}
type UpdateDomainsResponseSuccess = Pick<Domain, 'id'> & {
  object: 'domain';
};
type UpdateDomainsResponse = Response<UpdateDomainsResponseSuccess>;
//#endregion
//#region src/domains/interfaces/verify-domain.interface.d.ts
type VerifyDomainsResponseSuccess = Pick<Domain, 'id'> & {
  object: 'domain';
};
type VerifyDomainsResponse = Response<VerifyDomainsResponseSuccess>;
//#endregion
//#region src/common/interfaces/attachment.interface.d.ts
interface Attachment$1 {
  id: string;
  filename?: string;
  size: number;
  content_type: string;
  content_disposition: 'inline' | 'attachment';
  content_id?: string;
  download_url: string;
  expires_at: string;
}
//#endregion
//#region src/emails/attachments/interfaces/get-attachment.interface.d.ts
interface GetAttachmentOptions {
  emailId: string;
  id: string;
}
type GetAttachmentResponseSuccess = {
  object: 'attachment';
} & Attachment$1;
type GetAttachmentResponse = Response<GetAttachmentResponseSuccess>;
//#endregion
//#region src/emails/attachments/interfaces/list-attachments.interface.d.ts
type ListAttachmentsOptions = PaginationOptions & {
  emailId: string;
};
interface ListAttachmentsApiResponse {
  object: 'list';
  has_more: boolean;
  data: Attachment$1[];
}
interface ListAttachmentsResponseSuccess {
  object: 'list';
  has_more: boolean;
  data: Attachment$1[];
}
type ListAttachmentsResponse = Response<ListAttachmentsResponseSuccess>;
//#endregion
//#region src/emails/interfaces/cancel-email-options.interface.d.ts
interface CancelEmailResponseSuccess {
  object: 'email';
  id: string;
}
type CancelEmailResponse = Response<CancelEmailResponseSuccess>;
//#endregion
//#region src/emails/interfaces/get-email-options.interface.d.ts
interface GetEmailResponseSuccess {
  bcc: string[] | null;
  cc: string[] | null;
  created_at: string;
  from: string;
  html: string | null;
  id: string;
  last_event: 'bounced' | 'canceled' | 'clicked' | 'complained' | 'delivered' | 'delivery_delayed' | 'failed' | 'opened' | 'queued' | 'scheduled' | 'sent';
  reply_to: string[] | null;
  subject: string;
  text: string | null;
  tags?: {
    name: string;
    value: string;
  }[];
  to: string[];
  topic_id?: string | null;
  scheduled_at: string | null;
  object: 'email';
}
type GetEmailResponse = Response<GetEmailResponseSuccess>;
//#endregion
//#region src/emails/interfaces/update-email-options.interface.d.ts
interface UpdateEmailOptions {
  id: string;
  scheduledAt: string;
}
interface UpdateEmailResponseSuccess {
  id: string;
  object: 'email';
}
type UpdateEmailResponse = Response<UpdateEmailResponseSuccess>;
//#endregion
//#region src/emails/receiving/interfaces/get-receiving-email.interface.d.ts
interface GetReceivingEmailResponseSuccess {
  object: 'email';
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  html: string | null;
  text: string | null;
  headers: Record<string, string>;
  message_id: string;
  attachments: Array<{
    id: string;
    filename: string;
    size: number;
    content_type: string;
    content_id: string;
    content_disposition: string;
  }>;
}
type GetReceivingEmailResponse = Response<GetReceivingEmailResponseSuccess>;
//#endregion
//#region src/emails/receiving/interfaces/list-receiving-emails.interface.d.ts
type ListReceivingEmailsOptions = PaginationOptions;
type ListReceivingEmail = Omit<GetReceivingEmailResponseSuccess, 'html' | 'text' | 'headers' | 'object'>;
interface ListReceivingEmailsResponseSuccess {
  object: 'list';
  has_more: boolean;
  data: ListReceivingEmail[];
}
type ListReceivingEmailsResponse = {
  data: ListReceivingEmailsResponseSuccess;
  error: null;
} | {
  data: null;
  error: ErrorResponse;
};
//#endregion
//#region src/api-keys/api-keys.d.ts
declare class ApiKeys {
  private readonly resend;
  constructor(resend: Resend);
  create(payload: CreateApiKeyOptions, options?: CreateApiKeyRequestOptions): Promise<CreateApiKeyResponse>;
  list(options?: ListApiKeysOptions): Promise<ListApiKeysResponse>;
  remove(id: string): Promise<RemoveApiKeyResponse>;
}
//#endregion
//#region src/batch/batch.d.ts
declare class Batch {
  private readonly resend;
  constructor(resend: Resend);
  send<Options extends CreateBatchRequestOptions>(payload: CreateBatchOptions, options?: Options): Promise<CreateBatchResponse<Options>>;
  create<Options extends CreateBatchRequestOptions>(payload: CreateBatchOptions, options?: Options): Promise<CreateBatchResponse<Options>>;
}
//#endregion
//#region src/broadcasts/broadcasts.d.ts
declare class Broadcasts {
  private readonly resend;
  constructor(resend: Resend);
  create(payload: CreateBroadcastOptions, options?: CreateBroadcastRequestOptions): Promise<SendBroadcastResponse>;
  send(id: string, payload?: SendBroadcastOptions): Promise<SendBroadcastResponse>;
  list(options?: ListBroadcastsOptions): Promise<ListBroadcastsResponse>;
  get(id: string): Promise<GetBroadcastResponse>;
  remove(id: string): Promise<RemoveBroadcastResponse>;
  update(id: string, payload: UpdateBroadcastOptions): Promise<UpdateBroadcastResponse>;
}
//#endregion
//#region src/contact-properties/interfaces/contact-property.d.ts
type StringBaseContactProperty = {
  type: 'string';
  fallbackValue: string | null;
};
type NumberBaseContactProperty = {
  type: 'number';
  fallbackValue: number | null;
};
type ContactProperty = {
  id: string;
  createdAt: string;
  key: string;
} & (StringBaseContactProperty | NumberBaseContactProperty);
//#endregion
//#region src/contact-properties/interfaces/create-contact-property-options.interface.d.ts
type StringBaseContactPropertyOptions = {
  type: 'string';
  fallbackValue?: string | null;
};
type NumberBaseContactPropertyOptions = {
  type: 'number';
  fallbackValue?: number | null;
};
type CreateContactPropertyOptions = {
  key: string;
} & (StringBaseContactPropertyOptions | NumberBaseContactPropertyOptions);
type CreateContactPropertyResponseSuccess = Pick<ContactProperty, 'id'> & {
  object: 'contact_property';
};
type CreateContactPropertyResponse = Response<CreateContactPropertyResponseSuccess>;
//#endregion
//#region src/contact-properties/interfaces/delete-contact-property-options.interface.d.ts
type RemoveContactPropertyResponseSuccess = Pick<ContactProperty, 'id'> & {
  object: 'contact_property';
  deleted: boolean;
};
type RemoveContactPropertyResponse = Response<RemoveContactPropertyResponseSuccess>;
//#endregion
//#region src/contact-properties/interfaces/get-contact-property.interface.d.ts
type GetContactPropertyResponse = Response<ContactProperty & {
  object: 'contact_property';
}>;
//#endregion
//#region src/contact-properties/interfaces/list-contact-properties-options.interface.d.ts
type ListContactPropertiesOptions = PaginationOptions;
type ListContactPropertiesResponse = Response<{
  object: 'list';
  has_more: boolean;
  data: ContactProperty[];
}>;
//#endregion
//#region src/contact-properties/interfaces/update-contact-property-options.interface.d.ts
type UpdateContactPropertyOptions = {
  id: string;
  fallbackValue?: string | number | null;
};
type UpdateContactPropertyResponseSuccess = Pick<ContactProperty, 'id'> & {
  object: 'contact_property';
};
type UpdateContactPropertyResponse = Response<UpdateContactPropertyResponseSuccess>;
//#endregion
//#region src/contact-properties/contact-properties.d.ts
declare class ContactProperties {
  private readonly resend;
  constructor(resend: Resend);
  create(options: CreateContactPropertyOptions): Promise<CreateContactPropertyResponse>;
  list(options?: ListContactPropertiesOptions): Promise<ListContactPropertiesResponse>;
  get(id: string): Promise<GetContactPropertyResponse>;
  update(payload: UpdateContactPropertyOptions): Promise<UpdateContactPropertyResponse>;
  remove(id: string): Promise<RemoveContactPropertyResponse>;
}
//#endregion
//#region src/contacts/segments/interfaces/contact-segments.interface.d.ts
type ContactSegmentsBaseOptions = {
  contactId: string;
  email?: never;
} | {
  contactId?: never;
  email: string;
};
//#endregion
//#region src/contacts/segments/interfaces/add-contact-segment.interface.d.ts
type AddContactSegmentOptions = ContactSegmentsBaseOptions & {
  segmentId: string;
};
interface AddContactSegmentResponseSuccess {
  id: string;
}
type AddContactSegmentResponse = Response<AddContactSegmentResponseSuccess>;
//#endregion
//#region src/segments/interfaces/segment.d.ts
interface Segment {
  created_at: string;
  id: string;
  name: string;
}
//#endregion
//#region src/contacts/segments/interfaces/list-contact-segments.interface.d.ts
type ListContactSegmentsOptions = PaginationOptions & ContactSegmentsBaseOptions;
type ListContactSegmentsResponseSuccess = PaginatedData<Segment[]>;
type ListContactSegmentsResponse = Response<ListContactSegmentsResponseSuccess>;
//#endregion
//#region src/contacts/segments/interfaces/remove-contact-segment.interface.d.ts
type RemoveContactSegmentOptions = ContactSegmentsBaseOptions & {
  segmentId: string;
};
interface RemoveContactSegmentResponseSuccess {
  id: string;
  deleted: boolean;
}
type RemoveContactSegmentResponse = Response<RemoveContactSegmentResponseSuccess>;
//#endregion
//#region src/contacts/segments/contact-segments.d.ts
declare class ContactSegments {
  private readonly resend;
  constructor(resend: Resend);
  list(options: ListContactSegmentsOptions): Promise<ListContactSegmentsResponse>;
  add(options: AddContactSegmentOptions): Promise<AddContactSegmentResponse>;
  remove(options: RemoveContactSegmentOptions): Promise<RemoveContactSegmentResponse>;
}
//#endregion
//#region src/contacts/topics/interfaces/list-contact-topics.interface.d.ts
interface ListContactTopicsBaseOptions {
  id?: string;
  email?: string;
}
type ListContactTopicsOptions = ListContactTopicsBaseOptions & PaginationOptions;
interface ContactTopic {
  id: string;
  name: string;
  description: string | null;
  subscription: 'opt_in' | 'opt_out';
}
type ListContactTopicsResponseSuccess = PaginatedData<ContactTopic[]>;
type ListContactTopicsResponse = Response<ListContactTopicsResponseSuccess>;
//#endregion
//#region src/contacts/topics/interfaces/update-contact-topics.interface.d.ts
interface UpdateContactTopicsBaseOptions {
  id?: string;
  email?: string;
}
interface UpdateContactTopicsOptions extends UpdateContactTopicsBaseOptions {
  topics: {
    id: string;
    subscription: 'opt_in' | 'opt_out';
  }[];
}
interface UpdateContactTopicsResponseSuccess {
  id: string;
}
type UpdateContactTopicsResponse = Response<UpdateContactTopicsResponseSuccess>;
//#endregion
//#region src/contacts/topics/contact-topics.d.ts
declare class ContactTopics {
  private readonly resend;
  constructor(resend: Resend);
  update(payload: UpdateContactTopicsOptions): Promise<UpdateContactTopicsResponse>;
  list(options: ListContactTopicsOptions): Promise<ListContactTopicsResponse>;
}
//#endregion
//#region src/contacts/contacts.d.ts
declare class Contacts {
  private readonly resend;
  readonly topics: ContactTopics;
  readonly segments: ContactSegments;
  constructor(resend: Resend);
  create(payload: CreateContactOptions, options?: CreateContactRequestOptions): Promise<CreateContactResponse>;
  list(options?: ListContactsOptions): Promise<ListContactsResponse>;
  get(options: GetContactOptions): Promise<GetContactResponse>;
  update(options: UpdateContactOptions): Promise<UpdateContactResponse>;
  remove(payload: RemoveContactOptions): Promise<RemoveContactsResponse>;
}
//#endregion
//#region src/domains/domains.d.ts
declare class Domains {
  private readonly resend;
  constructor(resend: Resend);
  create(payload: CreateDomainOptions, options?: CreateDomainRequestOptions): Promise<CreateDomainResponse>;
  list(options?: ListDomainsOptions): Promise<ListDomainsResponse>;
  get(id: string): Promise<GetDomainResponse>;
  update(payload: UpdateDomainsOptions): Promise<UpdateDomainsResponse>;
  remove(id: string): Promise<RemoveDomainsResponse>;
  verify(id: string): Promise<VerifyDomainsResponse>;
}
//#endregion
//#region src/emails/attachments/attachments.d.ts
declare class Attachments {
  private readonly resend;
  constructor(resend: Resend);
  get(options: GetAttachmentOptions): Promise<GetAttachmentResponse>;
  list(options: ListAttachmentsOptions): Promise<ListAttachmentsResponse>;
}
//#endregion
//#region src/emails/interfaces/list-emails-options.interface.d.ts
type ListEmailsOptions = PaginationOptions;
type ListEmail = Omit<GetEmailResponseSuccess, 'html' | 'text' | 'tags' | 'object'>;
type ListEmailsResponseSuccess = {
  object: 'list';
  has_more: boolean;
  data: ListEmail[];
};
type ListEmailsResponse = Response<ListEmailsResponseSuccess>;
//#endregion
//#region src/emails/receiving/attachments/attachments.d.ts
declare class Attachments$1 {
  private readonly resend;
  constructor(resend: Resend);
  get(options: GetAttachmentOptions): Promise<GetAttachmentResponse>;
  list(options: ListAttachmentsOptions): Promise<ListAttachmentsResponse>;
}
//#endregion
//#region src/emails/receiving/receiving.d.ts
declare class Receiving {
  private readonly resend;
  readonly attachments: Attachments$1;
  constructor(resend: Resend);
  get(id: string): Promise<GetReceivingEmailResponse>;
  list(options?: ListReceivingEmailsOptions): Promise<ListReceivingEmailsResponse>;
}
//#endregion
//#region src/emails/emails.d.ts
declare class Emails {
  private readonly resend;
  readonly attachments: Attachments;
  readonly receiving: Receiving;
  constructor(resend: Resend);
  send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>;
  create(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>;
  get(id: string): Promise<GetEmailResponse>;
  list(options?: ListEmailsOptions): Promise<ListEmailsResponse>;
  update(payload: UpdateEmailOptions): Promise<UpdateEmailResponse>;
  cancel(id: string): Promise<CancelEmailResponse>;
}
//#endregion
//#region src/segments/interfaces/create-segment-options.interface.d.ts
interface CreateSegmentOptions {
  name: string;
}
interface CreateSegmentRequestOptions extends PostOptions {}
interface CreateSegmentResponseSuccess extends Pick<Segment, 'name' | 'id'> {
  object: 'segment';
}
type CreateSegmentResponse = Response<CreateSegmentResponseSuccess>;
//#endregion
//#region src/segments/interfaces/get-segment.interface.d.ts
interface GetSegmentResponseSuccess extends Pick<Segment, 'id' | 'name' | 'created_at'> {
  object: 'segment';
}
type GetSegmentResponse = Response<GetSegmentResponseSuccess>;
//#endregion
//#region src/segments/interfaces/list-segments.interface.d.ts
type ListSegmentsOptions = PaginationOptions;
type ListSegmentsResponseSuccess = {
  object: 'list';
  data: Segment[];
  has_more: boolean;
};
type ListSegmentsResponse = Response<ListSegmentsResponseSuccess>;
//#endregion
//#region src/segments/interfaces/remove-segment.interface.d.ts
interface RemoveSegmentResponseSuccess extends Pick<Segment, 'id'> {
  object: 'segment';
  deleted: boolean;
}
type RemoveSegmentResponse = Response<RemoveSegmentResponseSuccess>;
//#endregion
//#region src/segments/segments.d.ts
declare class Segments {
  private readonly resend;
  constructor(resend: Resend);
  create(payload: CreateSegmentOptions, options?: CreateSegmentRequestOptions): Promise<CreateSegmentResponse>;
  list(options?: ListSegmentsOptions): Promise<ListSegmentsResponse>;
  get(id: string): Promise<GetSegmentResponse>;
  remove(id: string): Promise<RemoveSegmentResponse>;
}
//#endregion
//#region src/templates/interfaces/template.d.ts
interface Template {
  id: string;
  name: string;
  subject: string | null;
  html: string;
  text: string | null;
  status: 'draft' | 'published';
  variables: TemplateVariable[] | null;
  alias: string | null;
  from: string | null;
  reply_to: string[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  has_unpublished_versions: boolean;
  current_version_id: string;
}
interface TemplateVariable {
  key: string;
  fallback_value: string | number | null;
  type: 'string' | 'number';
  created_at: string;
  updated_at: string;
}
//#endregion
//#region src/templates/interfaces/create-template-options.interface.d.ts
type TemplateContentCreationOptions = RequireAtLeastOne<{
  html: string;
  react: React.ReactNode;
}>;
type TemplateVariableCreationOptions = Pick<TemplateVariable, 'key' | 'type'> & ({
  type: 'string';
  fallbackValue?: string | null;
} | {
  type: 'number';
  fallbackValue?: number | null;
});
type TemplateOptionalFieldsForCreation = Partial<Pick<Template, 'subject' | 'text' | 'alias' | 'from'>> & {
  replyTo?: string[] | string;
  variables?: TemplateVariableCreationOptions[];
};
type CreateTemplateOptions = Pick<Template, 'name'> & TemplateOptionalFieldsForCreation & TemplateContentCreationOptions;
interface CreateTemplateResponseSuccess extends Pick<Template, 'id'> {
  object: 'template';
}
type CreateTemplateResponse = Response<CreateTemplateResponseSuccess>;
//#endregion
//#region src/templates/interfaces/duplicate-template.interface.d.ts
interface DuplicateTemplateResponseSuccess extends Pick<Template, 'id'> {
  object: 'template';
}
type DuplicateTemplateResponse = Response<DuplicateTemplateResponseSuccess>;
//#endregion
//#region src/templates/interfaces/publish-template.interface.d.ts
interface PublishTemplateResponseSuccess extends Pick<Template, 'id'> {
  object: 'template';
}
type PublishTemplateResponse = Response<PublishTemplateResponseSuccess>;
//#endregion
//#region src/templates/chainable-template-result.d.ts
declare class ChainableTemplateResult<T extends CreateTemplateResponse | DuplicateTemplateResponse> implements PromiseLike<T> {
  private readonly promise;
  private readonly publishFn;
  constructor(promise: Promise<T>, publishFn: (id: string) => Promise<PublishTemplateResponse>);
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2>;
  publish(): Promise<PublishTemplateResponse>;
}
//#endregion
//#region src/templates/interfaces/get-template.interface.d.ts
interface GetTemplateResponseSuccess extends Template {
  object: 'template';
}
type GetTemplateResponse = Response<GetTemplateResponseSuccess>;
//#endregion
//#region src/templates/interfaces/list-templates.interface.d.ts
interface TemplateListItem extends Pick<Template, 'id' | 'name' | 'created_at' | 'updated_at' | 'status' | 'published_at' | 'alias'> {}
interface ListTemplatesResponseSuccess {
  object: 'list';
  data: TemplateListItem[];
  has_more: boolean;
}
type ListTemplatesResponse = Response<ListTemplatesResponseSuccess>;
//#endregion
//#region src/templates/interfaces/remove-template.interface.d.ts
interface RemoveTemplateResponseSuccess {
  object: 'template';
  id: string;
  deleted: boolean;
}
type RemoveTemplateResponse = Response<RemoveTemplateResponseSuccess>;
//#endregion
//#region src/templates/interfaces/update-template.interface.d.ts
type TemplateVariableUpdateOptions = Pick<TemplateVariable, 'key' | 'type'> & ({
  type: 'string';
  fallbackValue?: string | null;
} | {
  type: 'number';
  fallbackValue?: number | null;
});
interface UpdateTemplateOptions extends Partial<Pick<Template, 'name' | 'subject' | 'html' | 'text' | 'from' | 'alias'>> {
  variables?: TemplateVariableUpdateOptions[];
  replyTo?: string[] | string;
}
interface UpdateTemplateResponseSuccess extends Pick<Template, 'id'> {
  object: 'template';
}
type UpdateTemplateResponse = Response<UpdateTemplateResponseSuccess>;
//#endregion
//#region src/templates/templates.d.ts
declare class Templates {
  private readonly resend;
  private renderAsync?;
  constructor(resend: Resend);
  create(payload: CreateTemplateOptions): ChainableTemplateResult<CreateTemplateResponse>;
  private performCreate;
  remove(identifier: string): Promise<RemoveTemplateResponse>;
  get(identifier: string): Promise<GetTemplateResponse>;
  list(options?: PaginationOptions): Promise<ListTemplatesResponse>;
  duplicate(identifier: string): ChainableTemplateResult<DuplicateTemplateResponse>;
  publish(identifier: string): Promise<PublishTemplateResponse>;
  update(identifier: string, payload: UpdateTemplateOptions): Promise<UpdateTemplateResponse>;
}
//#endregion
//#region src/topics/interfaces/topic.d.ts
interface Topic {
  id: string;
  name: string;
  description?: string;
  defaultSubscription: 'opt_in' | 'opt_out';
  created_at: string;
}
//#endregion
//#region src/topics/interfaces/create-topic-options.interface.d.ts
interface CreateTopicOptions {
  name: string;
  description?: string;
  defaultSubscription: 'opt_in' | 'opt_out';
}
type CreateTopicResponseSuccess = Pick<Topic, 'id'>;
type CreateTopicResponse = Response<CreateTopicResponseSuccess>;
//#endregion
//#region src/topics/interfaces/get-contact.interface.d.ts
type GetTopicResponseSuccess = Topic;
type GetTopicResponse = Response<GetTopicResponseSuccess>;
//#endregion
//#region src/topics/interfaces/list-topics.interface.d.ts
interface ListTopicsResponseSuccess {
  data: Topic[];
}
type ListTopicsResponse = Response<ListTopicsResponseSuccess>;
//#endregion
//#region src/topics/interfaces/remove-topic.interface.d.ts
type RemoveTopicResponseSuccess = Pick<Topic, 'id'> & {
  object: 'topic';
  deleted: boolean;
};
type RemoveTopicResponse = Response<RemoveTopicResponseSuccess>;
//#endregion
//#region src/topics/interfaces/update-topic.interface.d.ts
interface UpdateTopicOptions {
  id: string;
  name?: string;
  description?: string;
}
type UpdateTopicResponseSuccess = Pick<Topic, 'id'>;
type UpdateTopicResponse = Response<UpdateTopicResponseSuccess>;
//#endregion
//#region src/topics/topics.d.ts
declare class Topics {
  private readonly resend;
  constructor(resend: Resend);
  create(payload: CreateTopicOptions): Promise<CreateTopicResponse>;
  list(): Promise<ListTopicsResponse>;
  get(id: string): Promise<GetTopicResponse>;
  update(payload: UpdateTopicOptions): Promise<UpdateTopicResponse>;
  remove(id: string): Promise<RemoveTopicResponse>;
}
//#endregion
//#region src/webhooks/interfaces/webhook-event.interface.d.ts
type WebhookEvent = 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked' | 'email.received' | 'email.failed' | 'contact.created' | 'contact.updated' | 'contact.deleted' | 'domain.created' | 'domain.updated' | 'domain.deleted';
//#endregion
//#region src/webhooks/interfaces/create-webhook-options.interface.d.ts
interface CreateWebhookOptions {
  endpoint: string;
  events: WebhookEvent[];
}
interface CreateWebhookRequestOptions extends PostOptions {}
interface CreateWebhookResponseSuccess {
  object: 'webhook';
  id: string;
  signing_secret: string;
}
type CreateWebhookResponse = Response<CreateWebhookResponseSuccess>;
//#endregion
//#region src/webhooks/interfaces/get-webhook.interface.d.ts
interface GetWebhookResponseSuccess {
  object: 'webhook';
  id: string;
  created_at: string;
  status: 'enabled' | 'disabled';
  endpoint: string;
  events: WebhookEvent[] | null;
  signing_secret: string;
}
type GetWebhookResponse = Response<GetWebhookResponseSuccess>;
//#endregion
//#region src/webhooks/interfaces/list-webhooks.interface.d.ts
type ListWebhooksOptions = PaginationOptions;
interface Webhook {
  id: string;
  endpoint: string;
  created_at: string;
  status: 'enabled' | 'disabled';
  events: WebhookEvent[] | null;
}
type ListWebhooksResponseSuccess = {
  object: 'list';
  has_more: boolean;
  data: Webhook[];
};
type ListWebhooksResponse = Response<ListWebhooksResponseSuccess>;
//#endregion
//#region src/webhooks/interfaces/remove-webhook.interface.d.ts
type RemoveWebhookResponseSuccess = Pick<Webhook, 'id'> & {
  object: 'webhook';
  deleted: boolean;
};
type RemoveWebhookResponse = Response<RemoveWebhookResponseSuccess>;
//#endregion
//#region src/webhooks/interfaces/update-webhook.interface.d.ts
interface UpdateWebhookOptions {
  endpoint?: string;
  events?: WebhookEvent[];
  status?: 'enabled' | 'disabled';
}
interface UpdateWebhookResponseSuccess {
  object: 'webhook';
  id: string;
}
type UpdateWebhookResponse = Response<UpdateWebhookResponseSuccess>;
//#endregion
//#region src/webhooks/webhooks.d.ts
interface Headers {
  id: string;
  timestamp: string;
  signature: string;
}
interface VerifyWebhookOptions {
  payload: string;
  headers: Headers;
  webhookSecret: string;
}
declare class Webhooks {
  private readonly resend;
  constructor(resend: Resend);
  create(payload: CreateWebhookOptions, options?: CreateWebhookRequestOptions): Promise<CreateWebhookResponse>;
  get(id: string): Promise<GetWebhookResponse>;
  list(options?: ListWebhooksOptions): Promise<ListWebhooksResponse>;
  update(id: string, payload: UpdateWebhookOptions): Promise<UpdateWebhookResponse>;
  remove(id: string): Promise<RemoveWebhookResponse>;
  verify(payload: VerifyWebhookOptions): unknown;
}
//#endregion
//#region src/resend.d.ts
declare class Resend {
  readonly key?: string | undefined;
  private readonly headers;
  readonly apiKeys: ApiKeys;
  readonly segments: Segments;
  /**
   * @deprecated Use segments instead
   */
  readonly audiences: Segments;
  readonly batch: Batch;
  readonly broadcasts: Broadcasts;
  readonly contacts: Contacts;
  readonly contactProperties: ContactProperties;
  readonly domains: Domains;
  readonly emails: Emails;
  readonly webhooks: Webhooks;
  readonly templates: Templates;
  readonly topics: Topics;
  constructor(key?: string | undefined);
  fetchRequest<T>(path: string, options?: {}): Promise<Response<T>>;
  post<T>(path: string, entity?: unknown, options?: PostOptions & IdempotentRequest): Promise<Response<T>>;
  get<T>(path: string, options?: GetOptions): Promise<Response<T>>;
  put<T>(path: string, entity: unknown, options?: PutOptions): Promise<Response<T>>;
  patch<T>(path: string, entity: unknown, options?: PatchOptions): Promise<Response<T>>;
  delete<T>(path: string, query?: unknown): Promise<Response<T>>;
}
//#endregion
export { ApiKey, Attachment, Broadcast, CancelEmailResponse, CancelEmailResponseSuccess, Contact, CreateApiKeyOptions, CreateApiKeyRequestOptions, CreateApiKeyResponse, CreateApiKeyResponseSuccess, CreateBatchOptions, CreateBatchRequestOptions, CreateBatchResponse, CreateBatchSuccessResponse, CreateBroadcastOptions, CreateBroadcastRequestOptions, CreateBroadcastResponse, CreateBroadcastResponseSuccess, CreateContactOptions, CreateContactRequestOptions, CreateContactResponse, CreateContactResponseSuccess, CreateDomainOptions, CreateDomainRequestOptions, CreateDomainResponse, CreateDomainResponseSuccess, CreateEmailOptions, CreateEmailRequestOptions, CreateEmailResponse, CreateEmailResponseSuccess, CreateSegmentOptions, CreateSegmentRequestOptions, CreateSegmentResponse, CreateSegmentResponseSuccess, CreateWebhookOptions, CreateWebhookRequestOptions, CreateWebhookResponse, CreateWebhookResponseSuccess, Domain, DomainApiOptions, DomainCapabilities, DomainCapabilityStatus, DomainDkimRecord, DomainNameservers, DomainRecords, DomainRegion, DomainSpfRecord, DomainStatus, EmailApiAttachment, EmailApiOptions, type ErrorResponse, GetAttachmentOptions, GetAttachmentResponse, GetAttachmentResponseSuccess, GetBroadcastResponse, GetBroadcastResponseSuccess, GetContactOptions, GetContactResponse, GetContactResponseSuccess, GetDomainResponse, GetDomainResponseSuccess, GetEmailResponse, GetEmailResponseSuccess, GetOptions, GetReceivingEmailResponse, GetReceivingEmailResponseSuccess, GetSegmentResponse, GetSegmentResponseSuccess, GetWebhookResponse, GetWebhookResponseSuccess, IdempotentRequest, ListApiKeysOptions, ListApiKeysResponse, ListApiKeysResponseSuccess, ListAttachmentsApiResponse, ListAttachmentsOptions, ListAttachmentsResponse, ListAttachmentsResponseSuccess, ListBroadcastsOptions, ListBroadcastsResponse, ListBroadcastsResponseSuccess, ListContactsOptions, ListContactsResponse, ListContactsResponseSuccess, ListDomainsOptions, ListDomainsResponse, ListDomainsResponseSuccess, ListReceivingEmail, ListReceivingEmailsOptions, ListReceivingEmailsResponse, ListReceivingEmailsResponseSuccess, ListSegmentsOptions, ListSegmentsResponse, ListSegmentsResponseSuccess, ListWebhooksOptions, ListWebhooksResponse, ListWebhooksResponseSuccess, PaginatedData, PaginationOptions, PatchOptions, PostOptions, PutOptions, ReceivingRecord, RemoveApiKeyResponse, RemoveApiKeyResponseSuccess, RemoveBroadcastResponse, RemoveBroadcastResponseSuccess, RemoveContactOptions, RemoveContactsResponse, RemoveContactsResponseSuccess, RemoveDomainsResponse, RemoveDomainsResponseSuccess, RemoveSegmentResponse, RemoveSegmentResponseSuccess, RemoveWebhookResponse, RemoveWebhookResponseSuccess, RequireAtLeastOne, Resend, type Response, Segment, SelectingField, SendBroadcastOptions, SendBroadcastRequestOptions, SendBroadcastResponse, SendBroadcastResponseSuccess, Tag, UpdateBroadcastOptions, UpdateBroadcastResponse, UpdateBroadcastResponseSuccess, UpdateContactOptions, UpdateContactResponse, UpdateContactResponseSuccess, UpdateDomainsOptions, UpdateDomainsResponse, UpdateDomainsResponseSuccess, UpdateEmailOptions, UpdateEmailResponse, UpdateEmailResponseSuccess, UpdateWebhookOptions, UpdateWebhookResponse, UpdateWebhookResponseSuccess, VerifyDomainsResponse, VerifyDomainsResponseSuccess, Webhook, WebhookEvent };