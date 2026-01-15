let svix = require("svix");

//#region package.json
var version = "6.6.0";

//#endregion
//#region src/common/utils/build-pagination-query.ts
/**
* Builds a query string from pagination options
* @param options - Pagination options containing limit and either after or before (but not both)
* @returns Query string (without leading '?') or empty string if no options
*/
function buildPaginationQuery(options) {
	const searchParams = new URLSearchParams();
	if (options.limit !== void 0) searchParams.set("limit", options.limit.toString());
	if ("after" in options && options.after !== void 0) searchParams.set("after", options.after);
	if ("before" in options && options.before !== void 0) searchParams.set("before", options.before);
	return searchParams.toString();
}

//#endregion
//#region src/api-keys/api-keys.ts
var ApiKeys = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/api-keys", payload, options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
		return await this.resend.get(url);
	}
	async remove(id) {
		return await this.resend.delete(`/api-keys/${id}`);
	}
};

//#endregion
//#region src/common/utils/parse-email-to-api-options.ts
function parseAttachments(attachments) {
	return attachments?.map((attachment) => ({
		content: attachment.content,
		filename: attachment.filename,
		path: attachment.path,
		content_type: attachment.contentType,
		content_id: attachment.contentId
	}));
}
function parseEmailToApiOptions(email) {
	return {
		attachments: parseAttachments(email.attachments),
		bcc: email.bcc,
		cc: email.cc,
		from: email.from,
		headers: email.headers,
		html: email.html,
		reply_to: email.replyTo,
		scheduled_at: email.scheduledAt,
		subject: email.subject,
		tags: email.tags,
		text: email.text,
		to: email.to,
		template: email.template ? {
			id: email.template.id,
			variables: email.template.variables
		} : void 0,
		topic_id: email.topicId
	};
}

//#endregion
//#region src/render.ts
async function render(node) {
	let render$1;
	try {
		({render: render$1} = await import("@react-email/render"));
	} catch {
		throw new Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.");
	}
	return render$1(node);
}

//#endregion
//#region src/batch/batch.ts
var Batch = class {
	constructor(resend) {
		this.resend = resend;
	}
	async send(payload, options) {
		return this.create(payload, options);
	}
	async create(payload, options) {
		const emails = [];
		for (const email of payload) {
			if (email.react) {
				email.html = await render(email.react);
				email.react = void 0;
			}
			emails.push(parseEmailToApiOptions(email));
		}
		return await this.resend.post("/emails/batch", emails, {
			...options,
			headers: {
				"x-batch-validation": options?.batchValidation ?? "strict",
				...options?.headers
			}
		});
	}
};

//#endregion
//#region src/broadcasts/broadcasts.ts
var Broadcasts = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.post("/broadcasts", {
			name: payload.name,
			segment_id: payload.segmentId,
			audience_id: payload.audienceId,
			preview_text: payload.previewText,
			from: payload.from,
			html: payload.html,
			reply_to: payload.replyTo,
			subject: payload.subject,
			text: payload.text,
			topic_id: payload.topicId
		}, options);
	}
	async send(id, payload) {
		return await this.resend.post(`/broadcasts/${id}/send`, { scheduled_at: payload?.scheduledAt });
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/broadcasts/${id}`);
	}
	async remove(id) {
		return await this.resend.delete(`/broadcasts/${id}`);
	}
	async update(id, payload) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.patch(`/broadcasts/${id}`, {
			name: payload.name,
			segment_id: payload.segmentId,
			audience_id: payload.audienceId,
			from: payload.from,
			html: payload.html,
			text: payload.text,
			subject: payload.subject,
			reply_to: payload.replyTo,
			preview_text: payload.previewText,
			topic_id: payload.topicId
		});
	}
};

//#endregion
//#region src/common/utils/parse-contact-properties-to-api-options.ts
function parseContactPropertyFromApi(contactProperty) {
	return {
		id: contactProperty.id,
		key: contactProperty.key,
		createdAt: contactProperty.created_at,
		type: contactProperty.type,
		fallbackValue: contactProperty.fallback_value
	};
}
function parseContactPropertyToApiOptions(contactProperty) {
	if ("key" in contactProperty) return {
		key: contactProperty.key,
		type: contactProperty.type,
		fallback_value: contactProperty.fallbackValue
	};
	return { fallback_value: contactProperty.fallbackValue };
}

//#endregion
//#region src/contact-properties/contact-properties.ts
var ContactProperties = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(options) {
		const apiOptions = parseContactPropertyToApiOptions(options);
		return await this.resend.post("/contact-properties", apiOptions);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
		const response = await this.resend.get(url);
		if (response.data) return {
			data: {
				...response.data,
				data: response.data.data.map((apiContactProperty) => parseContactPropertyFromApi(apiContactProperty))
			},
			headers: response.headers,
			error: null
		};
		return response;
	}
	async get(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const response = await this.resend.get(`/contact-properties/${id}`);
		if (response.data) return {
			data: {
				object: "contact_property",
				...parseContactPropertyFromApi(response.data)
			},
			headers: response.headers,
			error: null
		};
		return response;
	}
	async update(payload) {
		if (!payload.id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const apiOptions = parseContactPropertyToApiOptions(payload);
		return await this.resend.patch(`/contact-properties/${payload.id}`, apiOptions);
	}
	async remove(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.delete(`/contact-properties/${id}`);
	}
};

//#endregion
//#region src/contacts/segments/contact-segments.ts
var ContactSegments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async list(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
		return await this.resend.get(url);
	}
	async add(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		return this.resend.post(`/contacts/${identifier}/segments/${options.segmentId}`);
	}
	async remove(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		return this.resend.delete(`/contacts/${identifier}/segments/${options.segmentId}`);
	}
};

//#endregion
//#region src/contacts/topics/contact-topics.ts
var ContactTopics = class {
	constructor(resend) {
		this.resend = resend;
	}
	async update(payload) {
		if (!payload.id && !payload.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = payload.email ? payload.email : payload.id;
		return this.resend.patch(`/contacts/${identifier}/topics`, payload.topics);
	}
	async list(options) {
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.id;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
		return this.resend.get(url);
	}
};

//#endregion
//#region src/contacts/contacts.ts
var Contacts = class {
	constructor(resend) {
		this.resend = resend;
		this.topics = new ContactTopics(this.resend);
		this.segments = new ContactSegments(this.resend);
	}
	async create(payload, options = {}) {
		if (!payload.audienceId) return await this.resend.post("/contacts", {
			unsubscribed: payload.unsubscribed,
			email: payload.email,
			first_name: payload.firstName,
			last_name: payload.lastName,
			properties: payload.properties
		}, options);
		return await this.resend.post(`/audiences/${payload.audienceId}/contacts`, {
			unsubscribed: payload.unsubscribed,
			email: payload.email,
			first_name: payload.firstName,
			last_name: payload.lastName,
			properties: payload.properties
		}, options);
	}
	async list(options = {}) {
		const segmentId = options.segmentId ?? options.audienceId;
		if (!segmentId) {
			const queryString$1 = buildPaginationQuery(options);
			const url$1 = queryString$1 ? `/contacts?${queryString$1}` : "/contacts";
			return await this.resend.get(url$1);
		}
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
		return await this.resend.get(url);
	}
	async get(options) {
		if (typeof options === "string") return this.resend.get(`/contacts/${options}`);
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!options.audienceId) return this.resend.get(`/contacts/${options?.email ? options?.email : options?.id}`);
		return this.resend.get(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`);
	}
	async update(options) {
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!options.audienceId) return await this.resend.patch(`/contacts/${options?.email ? options?.email : options?.id}`, {
			unsubscribed: options.unsubscribed,
			first_name: options.firstName,
			last_name: options.lastName,
			properties: options.properties
		});
		return await this.resend.patch(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`, {
			unsubscribed: options.unsubscribed,
			first_name: options.firstName,
			last_name: options.lastName,
			properties: options.properties
		});
	}
	async remove(payload) {
		if (typeof payload === "string") return this.resend.delete(`/contacts/${payload}`);
		if (!payload.id && !payload.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!payload.audienceId) return this.resend.delete(`/contacts/${payload?.email ? payload?.email : payload?.id}`);
		return this.resend.delete(`/audiences/${payload.audienceId}/contacts/${payload?.email ? payload?.email : payload?.id}`);
	}
};

//#endregion
//#region src/common/utils/parse-domain-to-api-options.ts
function parseDomainToApiOptions(domain) {
	return {
		name: domain.name,
		region: domain.region,
		custom_return_path: domain.customReturnPath,
		capabilities: domain.capabilities,
		open_tracking: domain.openTracking,
		click_tracking: domain.clickTracking,
		tls: domain.tls
	};
}

//#endregion
//#region src/domains/domains.ts
var Domains = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/domains", parseDomainToApiOptions(payload), options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/domains?${queryString}` : "/domains";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/domains/${id}`);
	}
	async update(payload) {
		return await this.resend.patch(`/domains/${payload.id}`, {
			click_tracking: payload.clickTracking,
			open_tracking: payload.openTracking,
			tls: payload.tls,
			capabilities: payload.capabilities
		});
	}
	async remove(id) {
		return await this.resend.delete(`/domains/${id}`);
	}
	async verify(id) {
		return await this.resend.post(`/domains/${id}/verify`);
	}
};

//#endregion
//#region src/emails/attachments/attachments.ts
var Attachments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async get(options) {
		const { emailId, id } = options;
		return await this.resend.get(`/emails/${emailId}/attachments/${id}`);
	}
	async list(options) {
		const { emailId } = options;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/receiving/attachments/attachments.ts
var Attachments$1 = class {
	constructor(resend) {
		this.resend = resend;
	}
	async get(options) {
		const { emailId, id } = options;
		return await this.resend.get(`/emails/receiving/${emailId}/attachments/${id}`);
	}
	async list(options) {
		const { emailId } = options;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/receiving/receiving.ts
var Receiving = class {
	constructor(resend) {
		this.resend = resend;
		this.attachments = new Attachments$1(resend);
	}
	async get(id) {
		return await this.resend.get(`/emails/receiving/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/emails.ts
var Emails = class {
	constructor(resend) {
		this.resend = resend;
		this.attachments = new Attachments(resend);
		this.receiving = new Receiving(resend);
	}
	async send(payload, options = {}) {
		return this.create(payload, options);
	}
	async create(payload, options = {}) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.post("/emails", parseEmailToApiOptions(payload), options);
	}
	async get(id) {
		return await this.resend.get(`/emails/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails?${queryString}` : "/emails";
		return await this.resend.get(url);
	}
	async update(payload) {
		return await this.resend.patch(`/emails/${payload.id}`, { scheduled_at: payload.scheduledAt });
	}
	async cancel(id) {
		return await this.resend.post(`/emails/${id}/cancel`);
	}
};

//#endregion
//#region src/segments/segments.ts
var Segments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/segments", payload, options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/segments?${queryString}` : "/segments";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/segments/${id}`);
	}
	async remove(id) {
		return await this.resend.delete(`/segments/${id}`);
	}
};

//#endregion
//#region src/common/utils/get-pagination-query-properties.ts
function getPaginationQueryProperties(options = {}) {
	const query = new URLSearchParams();
	if (options.before) query.set("before", options.before);
	if (options.after) query.set("after", options.after);
	if (options.limit) query.set("limit", options.limit.toString());
	return query.size > 0 ? `?${query.toString()}` : "";
}

//#endregion
//#region src/common/utils/parse-template-to-api-options.ts
function parseVariables(variables) {
	return variables?.map((variable) => ({
		key: variable.key,
		type: variable.type,
		fallback_value: variable.fallbackValue
	}));
}
function parseTemplateToApiOptions(template) {
	return {
		name: "name" in template ? template.name : void 0,
		subject: template.subject,
		html: template.html,
		text: template.text,
		alias: template.alias,
		from: template.from,
		reply_to: template.replyTo,
		variables: parseVariables(template.variables)
	};
}

//#endregion
//#region src/templates/chainable-template-result.ts
var ChainableTemplateResult = class {
	constructor(promise, publishFn) {
		this.promise = promise;
		this.publishFn = publishFn;
	}
	then(onfulfilled, onrejected) {
		return this.promise.then(onfulfilled, onrejected);
	}
	async publish() {
		const { data, error } = await this.promise;
		if (error) return {
			data: null,
			headers: null,
			error
		};
		return this.publishFn(data.id);
	}
};

//#endregion
//#region src/templates/templates.ts
var Templates = class {
	constructor(resend) {
		this.resend = resend;
	}
	create(payload) {
		return new ChainableTemplateResult(this.performCreate(payload), this.publish.bind(this));
	}
	async performCreate(payload) {
		if (payload.react) {
			if (!this.renderAsync) try {
				const { renderAsync } = await import("@react-email/render");
				this.renderAsync = renderAsync;
			} catch {
				throw new Error("Failed to render React component. Make sure to install `@react-email/render`");
			}
			payload.html = await this.renderAsync(payload.react);
		}
		return this.resend.post("/templates", parseTemplateToApiOptions(payload));
	}
	async remove(identifier) {
		return await this.resend.delete(`/templates/${identifier}`);
	}
	async get(identifier) {
		return await this.resend.get(`/templates/${identifier}`);
	}
	async list(options = {}) {
		return this.resend.get(`/templates${getPaginationQueryProperties(options)}`);
	}
	duplicate(identifier) {
		return new ChainableTemplateResult(this.resend.post(`/templates/${identifier}/duplicate`), this.publish.bind(this));
	}
	async publish(identifier) {
		return await this.resend.post(`/templates/${identifier}/publish`);
	}
	async update(identifier, payload) {
		return await this.resend.patch(`/templates/${identifier}`, parseTemplateToApiOptions(payload));
	}
};

//#endregion
//#region src/topics/topics.ts
var Topics = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload) {
		const { defaultSubscription, ...body } = payload;
		return await this.resend.post("/topics", {
			...body,
			default_subscription: defaultSubscription
		});
	}
	async list() {
		return await this.resend.get("/topics");
	}
	async get(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.get(`/topics/${id}`);
	}
	async update(payload) {
		if (!payload.id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.patch(`/topics/${payload.id}`, payload);
	}
	async remove(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.delete(`/topics/${id}`);
	}
};

//#endregion
//#region src/webhooks/webhooks.ts
var Webhooks = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/webhooks", payload, options);
	}
	async get(id) {
		return await this.resend.get(`/webhooks/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
		return await this.resend.get(url);
	}
	async update(id, payload) {
		return await this.resend.patch(`/webhooks/${id}`, payload);
	}
	async remove(id) {
		return await this.resend.delete(`/webhooks/${id}`);
	}
	verify(payload) {
		return new svix.Webhook(payload.webhookSecret).verify(payload.payload, {
			"svix-id": payload.headers.id,
			"svix-timestamp": payload.headers.timestamp,
			"svix-signature": payload.headers.signature
		});
	}
};

//#endregion
//#region src/resend.ts
const defaultBaseUrl = "https://api.resend.com";
const defaultUserAgent = `resend-node:${version}`;
const baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
const userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
	constructor(key) {
		this.key = key;
		this.apiKeys = new ApiKeys(this);
		this.segments = new Segments(this);
		this.audiences = this.segments;
		this.batch = new Batch(this);
		this.broadcasts = new Broadcasts(this);
		this.contacts = new Contacts(this);
		this.contactProperties = new ContactProperties(this);
		this.domains = new Domains(this);
		this.emails = new Emails(this);
		this.webhooks = new Webhooks(this);
		this.templates = new Templates(this);
		this.topics = new Topics(this);
		if (!key) {
			if (typeof process !== "undefined" && process.env) this.key = process.env.RESEND_API_KEY;
			if (!this.key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
		}
		this.headers = new Headers({
			Authorization: `Bearer ${this.key}`,
			"User-Agent": userAgent,
			"Content-Type": "application/json"
		});
	}
	async fetchRequest(path, options = {}) {
		try {
			const response = await fetch(`${baseUrl}${path}`, options);
			if (!response.ok) try {
				const rawError = await response.text();
				return {
					data: null,
					error: JSON.parse(rawError),
					headers: Object.fromEntries(response.headers.entries())
				};
			} catch (err) {
				if (err instanceof SyntaxError) return {
					data: null,
					error: {
						name: "application_error",
						statusCode: response.status,
						message: "Internal server error. We are unable to process your request right now, please try again later."
					},
					headers: Object.fromEntries(response.headers.entries())
				};
				const error = {
					message: response.statusText,
					statusCode: response.status,
					name: "application_error"
				};
				if (err instanceof Error) return {
					data: null,
					error: {
						...error,
						message: err.message
					},
					headers: Object.fromEntries(response.headers.entries())
				};
				return {
					data: null,
					error,
					headers: Object.fromEntries(response.headers.entries())
				};
			}
			return {
				data: await response.json(),
				error: null,
				headers: Object.fromEntries(response.headers.entries())
			};
		} catch {
			return {
				data: null,
				error: {
					name: "application_error",
					statusCode: null,
					message: "Unable to fetch data. The request could not be resolved."
				},
				headers: null
			};
		}
	}
	async post(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
		const requestOptions = {
			method: "POST",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async get(path, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "GET",
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async put(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "PUT",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async patch(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "PATCH",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async delete(path, query) {
		const requestOptions = {
			method: "DELETE",
			body: JSON.stringify(query),
			headers: this.headers
		};
		return this.fetchRequest(path, requestOptions);
	}
};

//#endregion
exports.Resend = Resend;