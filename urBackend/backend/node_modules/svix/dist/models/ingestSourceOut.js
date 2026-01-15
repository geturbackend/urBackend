"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestSourceOutSerializer = void 0;
const adobeSignConfigOut_1 = require("./adobeSignConfigOut");
const airwallexConfigOut_1 = require("./airwallexConfigOut");
const checkbookConfigOut_1 = require("./checkbookConfigOut");
const cronConfig_1 = require("./cronConfig");
const docusignConfigOut_1 = require("./docusignConfigOut");
const easypostConfigOut_1 = require("./easypostConfigOut");
const githubConfigOut_1 = require("./githubConfigOut");
const hubspotConfigOut_1 = require("./hubspotConfigOut");
const orumIoConfigOut_1 = require("./orumIoConfigOut");
const pandaDocConfigOut_1 = require("./pandaDocConfigOut");
const portIoConfigOut_1 = require("./portIoConfigOut");
const rutterConfigOut_1 = require("./rutterConfigOut");
const segmentConfigOut_1 = require("./segmentConfigOut");
const shopifyConfigOut_1 = require("./shopifyConfigOut");
const slackConfigOut_1 = require("./slackConfigOut");
const stripeConfigOut_1 = require("./stripeConfigOut");
const svixConfigOut_1 = require("./svixConfigOut");
const telnyxConfigOut_1 = require("./telnyxConfigOut");
const vapiConfigOut_1 = require("./vapiConfigOut");
const veriffConfigOut_1 = require("./veriffConfigOut");
const zoomConfigOut_1 = require("./zoomConfigOut");
exports.IngestSourceOutSerializer = {
    _fromJsonObject(object) {
        const type = object["type"];
        function getConfig(type) {
            switch (type) {
                case "generic-webhook":
                    return {};
                case "cron":
                    return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
                case "adobe-sign":
                    return adobeSignConfigOut_1.AdobeSignConfigOutSerializer._fromJsonObject(object["config"]);
                case "beehiiv":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "brex":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "checkbook":
                    return checkbookConfigOut_1.CheckbookConfigOutSerializer._fromJsonObject(object["config"]);
                case "clerk":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "docusign":
                    return docusignConfigOut_1.DocusignConfigOutSerializer._fromJsonObject(object["config"]);
                case "easypost":
                    return easypostConfigOut_1.EasypostConfigOutSerializer._fromJsonObject(object["config"]);
                case "github":
                    return githubConfigOut_1.GithubConfigOutSerializer._fromJsonObject(object["config"]);
                case "guesty":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "hubspot":
                    return hubspotConfigOut_1.HubspotConfigOutSerializer._fromJsonObject(object["config"]);
                case "incident-io":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "lithic":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "nash":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "orum-io":
                    return orumIoConfigOut_1.OrumIoConfigOutSerializer._fromJsonObject(object["config"]);
                case "panda-doc":
                    return pandaDocConfigOut_1.PandaDocConfigOutSerializer._fromJsonObject(object["config"]);
                case "port-io":
                    return portIoConfigOut_1.PortIoConfigOutSerializer._fromJsonObject(object["config"]);
                case "pleo":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "replicate":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "resend":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "rutter":
                    return rutterConfigOut_1.RutterConfigOutSerializer._fromJsonObject(object["config"]);
                case "safebase":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "sardine":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "segment":
                    return segmentConfigOut_1.SegmentConfigOutSerializer._fromJsonObject(object["config"]);
                case "shopify":
                    return shopifyConfigOut_1.ShopifyConfigOutSerializer._fromJsonObject(object["config"]);
                case "slack":
                    return slackConfigOut_1.SlackConfigOutSerializer._fromJsonObject(object["config"]);
                case "stripe":
                    return stripeConfigOut_1.StripeConfigOutSerializer._fromJsonObject(object["config"]);
                case "stych":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "svix":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "zoom":
                    return zoomConfigOut_1.ZoomConfigOutSerializer._fromJsonObject(object["config"]);
                case "telnyx":
                    return telnyxConfigOut_1.TelnyxConfigOutSerializer._fromJsonObject(object["config"]);
                case "vapi":
                    return vapiConfigOut_1.VapiConfigOutSerializer._fromJsonObject(object["config"]);
                case "open-ai":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "render":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "veriff":
                    return veriffConfigOut_1.VeriffConfigOutSerializer._fromJsonObject(object["config"]);
                case "airwallex":
                    return airwallexConfigOut_1.AirwallexConfigOutSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            createdAt: new Date(object["createdAt"]),
            id: object["id"],
            ingestUrl: object["ingestUrl"],
            metadata: object["metadata"],
            name: object["name"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
        };
    },
    _toJsonObject(self) {
        let config;
        switch (self.type) {
            case "generic-webhook":
                config = {};
                break;
            case "cron":
                config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
                break;
            case "adobe-sign":
                config = adobeSignConfigOut_1.AdobeSignConfigOutSerializer._toJsonObject(self.config);
                break;
            case "beehiiv":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "brex":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "checkbook":
                config = checkbookConfigOut_1.CheckbookConfigOutSerializer._toJsonObject(self.config);
                break;
            case "clerk":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "docusign":
                config = docusignConfigOut_1.DocusignConfigOutSerializer._toJsonObject(self.config);
                break;
            case "easypost":
                config = easypostConfigOut_1.EasypostConfigOutSerializer._toJsonObject(self.config);
                break;
            case "github":
                config = githubConfigOut_1.GithubConfigOutSerializer._toJsonObject(self.config);
                break;
            case "guesty":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "hubspot":
                config = hubspotConfigOut_1.HubspotConfigOutSerializer._toJsonObject(self.config);
                break;
            case "incident-io":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "lithic":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "nash":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "orum-io":
                config = orumIoConfigOut_1.OrumIoConfigOutSerializer._toJsonObject(self.config);
                break;
            case "panda-doc":
                config = pandaDocConfigOut_1.PandaDocConfigOutSerializer._toJsonObject(self.config);
                break;
            case "port-io":
                config = portIoConfigOut_1.PortIoConfigOutSerializer._toJsonObject(self.config);
                break;
            case "pleo":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "replicate":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "resend":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "rutter":
                config = rutterConfigOut_1.RutterConfigOutSerializer._toJsonObject(self.config);
                break;
            case "safebase":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "sardine":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "segment":
                config = segmentConfigOut_1.SegmentConfigOutSerializer._toJsonObject(self.config);
                break;
            case "shopify":
                config = shopifyConfigOut_1.ShopifyConfigOutSerializer._toJsonObject(self.config);
                break;
            case "slack":
                config = slackConfigOut_1.SlackConfigOutSerializer._toJsonObject(self.config);
                break;
            case "stripe":
                config = stripeConfigOut_1.StripeConfigOutSerializer._toJsonObject(self.config);
                break;
            case "stych":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "svix":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "zoom":
                config = zoomConfigOut_1.ZoomConfigOutSerializer._toJsonObject(self.config);
                break;
            case "telnyx":
                config = telnyxConfigOut_1.TelnyxConfigOutSerializer._toJsonObject(self.config);
                break;
            case "vapi":
                config = vapiConfigOut_1.VapiConfigOutSerializer._toJsonObject(self.config);
                break;
            case "open-ai":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "render":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "veriff":
                config = veriffConfigOut_1.VeriffConfigOutSerializer._toJsonObject(self.config);
                break;
            case "airwallex":
                config = airwallexConfigOut_1.AirwallexConfigOutSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            createdAt: self.createdAt,
            id: self.id,
            ingestUrl: self.ingestUrl,
            metadata: self.metadata,
            name: self.name,
            uid: self.uid,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=ingestSourceOut.js.map