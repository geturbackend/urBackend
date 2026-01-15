"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestSourceInSerializer = void 0;
const adobeSignConfig_1 = require("./adobeSignConfig");
const airwallexConfig_1 = require("./airwallexConfig");
const checkbookConfig_1 = require("./checkbookConfig");
const cronConfig_1 = require("./cronConfig");
const docusignConfig_1 = require("./docusignConfig");
const easypostConfig_1 = require("./easypostConfig");
const githubConfig_1 = require("./githubConfig");
const hubspotConfig_1 = require("./hubspotConfig");
const orumIoConfig_1 = require("./orumIoConfig");
const pandaDocConfig_1 = require("./pandaDocConfig");
const portIoConfig_1 = require("./portIoConfig");
const rutterConfig_1 = require("./rutterConfig");
const segmentConfig_1 = require("./segmentConfig");
const shopifyConfig_1 = require("./shopifyConfig");
const slackConfig_1 = require("./slackConfig");
const stripeConfig_1 = require("./stripeConfig");
const svixConfig_1 = require("./svixConfig");
const telnyxConfig_1 = require("./telnyxConfig");
const vapiConfig_1 = require("./vapiConfig");
const veriffConfig_1 = require("./veriffConfig");
const zoomConfig_1 = require("./zoomConfig");
exports.IngestSourceInSerializer = {
    _fromJsonObject(object) {
        const type = object["type"];
        function getConfig(type) {
            switch (type) {
                case "generic-webhook":
                    return {};
                case "cron":
                    return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
                case "adobe-sign":
                    return adobeSignConfig_1.AdobeSignConfigSerializer._fromJsonObject(object["config"]);
                case "beehiiv":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "brex":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "checkbook":
                    return checkbookConfig_1.CheckbookConfigSerializer._fromJsonObject(object["config"]);
                case "clerk":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "docusign":
                    return docusignConfig_1.DocusignConfigSerializer._fromJsonObject(object["config"]);
                case "easypost":
                    return easypostConfig_1.EasypostConfigSerializer._fromJsonObject(object["config"]);
                case "github":
                    return githubConfig_1.GithubConfigSerializer._fromJsonObject(object["config"]);
                case "guesty":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "hubspot":
                    return hubspotConfig_1.HubspotConfigSerializer._fromJsonObject(object["config"]);
                case "incident-io":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "lithic":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "nash":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "orum-io":
                    return orumIoConfig_1.OrumIoConfigSerializer._fromJsonObject(object["config"]);
                case "panda-doc":
                    return pandaDocConfig_1.PandaDocConfigSerializer._fromJsonObject(object["config"]);
                case "port-io":
                    return portIoConfig_1.PortIoConfigSerializer._fromJsonObject(object["config"]);
                case "pleo":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "replicate":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "resend":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "rutter":
                    return rutterConfig_1.RutterConfigSerializer._fromJsonObject(object["config"]);
                case "safebase":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "sardine":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "segment":
                    return segmentConfig_1.SegmentConfigSerializer._fromJsonObject(object["config"]);
                case "shopify":
                    return shopifyConfig_1.ShopifyConfigSerializer._fromJsonObject(object["config"]);
                case "slack":
                    return slackConfig_1.SlackConfigSerializer._fromJsonObject(object["config"]);
                case "stripe":
                    return stripeConfig_1.StripeConfigSerializer._fromJsonObject(object["config"]);
                case "stych":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "svix":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "zoom":
                    return zoomConfig_1.ZoomConfigSerializer._fromJsonObject(object["config"]);
                case "telnyx":
                    return telnyxConfig_1.TelnyxConfigSerializer._fromJsonObject(object["config"]);
                case "vapi":
                    return vapiConfig_1.VapiConfigSerializer._fromJsonObject(object["config"]);
                case "open-ai":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "render":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "veriff":
                    return veriffConfig_1.VeriffConfigSerializer._fromJsonObject(object["config"]);
                case "airwallex":
                    return airwallexConfig_1.AirwallexConfigSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            metadata: object["metadata"],
            name: object["name"],
            uid: object["uid"],
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
                config = adobeSignConfig_1.AdobeSignConfigSerializer._toJsonObject(self.config);
                break;
            case "beehiiv":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "brex":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "checkbook":
                config = checkbookConfig_1.CheckbookConfigSerializer._toJsonObject(self.config);
                break;
            case "clerk":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "docusign":
                config = docusignConfig_1.DocusignConfigSerializer._toJsonObject(self.config);
                break;
            case "easypost":
                config = easypostConfig_1.EasypostConfigSerializer._toJsonObject(self.config);
                break;
            case "github":
                config = githubConfig_1.GithubConfigSerializer._toJsonObject(self.config);
                break;
            case "guesty":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "hubspot":
                config = hubspotConfig_1.HubspotConfigSerializer._toJsonObject(self.config);
                break;
            case "incident-io":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "lithic":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "nash":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "orum-io":
                config = orumIoConfig_1.OrumIoConfigSerializer._toJsonObject(self.config);
                break;
            case "panda-doc":
                config = pandaDocConfig_1.PandaDocConfigSerializer._toJsonObject(self.config);
                break;
            case "port-io":
                config = portIoConfig_1.PortIoConfigSerializer._toJsonObject(self.config);
                break;
            case "pleo":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "replicate":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "resend":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "rutter":
                config = rutterConfig_1.RutterConfigSerializer._toJsonObject(self.config);
                break;
            case "safebase":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "sardine":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "segment":
                config = segmentConfig_1.SegmentConfigSerializer._toJsonObject(self.config);
                break;
            case "shopify":
                config = shopifyConfig_1.ShopifyConfigSerializer._toJsonObject(self.config);
                break;
            case "slack":
                config = slackConfig_1.SlackConfigSerializer._toJsonObject(self.config);
                break;
            case "stripe":
                config = stripeConfig_1.StripeConfigSerializer._toJsonObject(self.config);
                break;
            case "stych":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "svix":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "zoom":
                config = zoomConfig_1.ZoomConfigSerializer._toJsonObject(self.config);
                break;
            case "telnyx":
                config = telnyxConfig_1.TelnyxConfigSerializer._toJsonObject(self.config);
                break;
            case "vapi":
                config = vapiConfig_1.VapiConfigSerializer._toJsonObject(self.config);
                break;
            case "open-ai":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "render":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "veriff":
                config = veriffConfig_1.VeriffConfigSerializer._toJsonObject(self.config);
                break;
            case "airwallex":
                config = airwallexConfig_1.AirwallexConfigSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            metadata: self.metadata,
            name: self.name,
            uid: self.uid,
        };
    },
};
//# sourceMappingURL=ingestSourceIn.js.map