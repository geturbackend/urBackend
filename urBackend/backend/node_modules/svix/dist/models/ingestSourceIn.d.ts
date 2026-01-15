import { AdobeSignConfig } from "./adobeSignConfig";
import { AirwallexConfig } from "./airwallexConfig";
import { CheckbookConfig } from "./checkbookConfig";
import { CronConfig } from "./cronConfig";
import { DocusignConfig } from "./docusignConfig";
import { EasypostConfig } from "./easypostConfig";
import { GithubConfig } from "./githubConfig";
import { HubspotConfig } from "./hubspotConfig";
import { OrumIoConfig } from "./orumIoConfig";
import { PandaDocConfig } from "./pandaDocConfig";
import { PortIoConfig } from "./portIoConfig";
import { RutterConfig } from "./rutterConfig";
import { SegmentConfig } from "./segmentConfig";
import { ShopifyConfig } from "./shopifyConfig";
import { SlackConfig } from "./slackConfig";
import { StripeConfig } from "./stripeConfig";
import { SvixConfig } from "./svixConfig";
import { TelnyxConfig } from "./telnyxConfig";
import { VapiConfig } from "./vapiConfig";
import { VeriffConfig } from "./veriffConfig";
import { ZoomConfig } from "./zoomConfig";
interface _IngestSourceInFields {
    metadata?: {
        [key: string]: string;
    };
    name: string;
    uid?: string | null;
}
interface IngestSourceInGenericWebhookConfig {
}
interface IngestSourceInGenericWebhook {
    type: "generic-webhook";
    config?: IngestSourceInGenericWebhookConfig;
}
interface IngestSourceInCron {
    type: "cron";
    config: CronConfig;
}
interface IngestSourceInAdobeSign {
    type: "adobe-sign";
    config: AdobeSignConfig;
}
interface IngestSourceInBeehiiv {
    type: "beehiiv";
    config: SvixConfig;
}
interface IngestSourceInBrex {
    type: "brex";
    config: SvixConfig;
}
interface IngestSourceInCheckbook {
    type: "checkbook";
    config: CheckbookConfig;
}
interface IngestSourceInClerk {
    type: "clerk";
    config: SvixConfig;
}
interface IngestSourceInDocusign {
    type: "docusign";
    config: DocusignConfig;
}
interface IngestSourceInEasypost {
    type: "easypost";
    config: EasypostConfig;
}
interface IngestSourceInGithub {
    type: "github";
    config: GithubConfig;
}
interface IngestSourceInGuesty {
    type: "guesty";
    config: SvixConfig;
}
interface IngestSourceInHubspot {
    type: "hubspot";
    config: HubspotConfig;
}
interface IngestSourceInIncidentIo {
    type: "incident-io";
    config: SvixConfig;
}
interface IngestSourceInLithic {
    type: "lithic";
    config: SvixConfig;
}
interface IngestSourceInNash {
    type: "nash";
    config: SvixConfig;
}
interface IngestSourceInOrumIo {
    type: "orum-io";
    config: OrumIoConfig;
}
interface IngestSourceInPandaDoc {
    type: "panda-doc";
    config: PandaDocConfig;
}
interface IngestSourceInPortIo {
    type: "port-io";
    config: PortIoConfig;
}
interface IngestSourceInPleo {
    type: "pleo";
    config: SvixConfig;
}
interface IngestSourceInReplicate {
    type: "replicate";
    config: SvixConfig;
}
interface IngestSourceInResend {
    type: "resend";
    config: SvixConfig;
}
interface IngestSourceInRutter {
    type: "rutter";
    config: RutterConfig;
}
interface IngestSourceInSafebase {
    type: "safebase";
    config: SvixConfig;
}
interface IngestSourceInSardine {
    type: "sardine";
    config: SvixConfig;
}
interface IngestSourceInSegment {
    type: "segment";
    config: SegmentConfig;
}
interface IngestSourceInShopify {
    type: "shopify";
    config: ShopifyConfig;
}
interface IngestSourceInSlack {
    type: "slack";
    config: SlackConfig;
}
interface IngestSourceInStripe {
    type: "stripe";
    config: StripeConfig;
}
interface IngestSourceInStych {
    type: "stych";
    config: SvixConfig;
}
interface IngestSourceInSvix {
    type: "svix";
    config: SvixConfig;
}
interface IngestSourceInZoom {
    type: "zoom";
    config: ZoomConfig;
}
interface IngestSourceInTelnyx {
    type: "telnyx";
    config: TelnyxConfig;
}
interface IngestSourceInVapi {
    type: "vapi";
    config: VapiConfig;
}
interface IngestSourceInOpenAi {
    type: "open-ai";
    config: SvixConfig;
}
interface IngestSourceInRender {
    type: "render";
    config: SvixConfig;
}
interface IngestSourceInVeriff {
    type: "veriff";
    config: VeriffConfig;
}
interface IngestSourceInAirwallex {
    type: "airwallex";
    config: AirwallexConfig;
}
export type IngestSourceIn = _IngestSourceInFields & (IngestSourceInGenericWebhook | IngestSourceInCron | IngestSourceInAdobeSign | IngestSourceInBeehiiv | IngestSourceInBrex | IngestSourceInCheckbook | IngestSourceInClerk | IngestSourceInDocusign | IngestSourceInEasypost | IngestSourceInGithub | IngestSourceInGuesty | IngestSourceInHubspot | IngestSourceInIncidentIo | IngestSourceInLithic | IngestSourceInNash | IngestSourceInOrumIo | IngestSourceInPandaDoc | IngestSourceInPortIo | IngestSourceInPleo | IngestSourceInReplicate | IngestSourceInResend | IngestSourceInRutter | IngestSourceInSafebase | IngestSourceInSardine | IngestSourceInSegment | IngestSourceInShopify | IngestSourceInSlack | IngestSourceInStripe | IngestSourceInStych | IngestSourceInSvix | IngestSourceInZoom | IngestSourceInTelnyx | IngestSourceInVapi | IngestSourceInOpenAi | IngestSourceInRender | IngestSourceInVeriff | IngestSourceInAirwallex);
export declare const IngestSourceInSerializer: {
    _fromJsonObject(object: any): IngestSourceIn;
    _toJsonObject(self: IngestSourceIn): any;
};
export {};
