import { AdobeSignConfigOut } from "./adobeSignConfigOut";
import { AirwallexConfigOut } from "./airwallexConfigOut";
import { CheckbookConfigOut } from "./checkbookConfigOut";
import { CronConfig } from "./cronConfig";
import { DocusignConfigOut } from "./docusignConfigOut";
import { EasypostConfigOut } from "./easypostConfigOut";
import { GithubConfigOut } from "./githubConfigOut";
import { HubspotConfigOut } from "./hubspotConfigOut";
import { OrumIoConfigOut } from "./orumIoConfigOut";
import { PandaDocConfigOut } from "./pandaDocConfigOut";
import { PortIoConfigOut } from "./portIoConfigOut";
import { RutterConfigOut } from "./rutterConfigOut";
import { SegmentConfigOut } from "./segmentConfigOut";
import { ShopifyConfigOut } from "./shopifyConfigOut";
import { SlackConfigOut } from "./slackConfigOut";
import { StripeConfigOut } from "./stripeConfigOut";
import { SvixConfigOut } from "./svixConfigOut";
import { TelnyxConfigOut } from "./telnyxConfigOut";
import { VapiConfigOut } from "./vapiConfigOut";
import { VeriffConfigOut } from "./veriffConfigOut";
import { ZoomConfigOut } from "./zoomConfigOut";
interface _IngestSourceOutFields {
    createdAt: Date;
    id: string;
    ingestUrl?: string | null;
    metadata: {
        [key: string]: string;
    };
    name: string;
    uid?: string | null;
    updatedAt: Date;
}
interface IngestSourceOutGenericWebhookConfig {
}
interface IngestSourceOutGenericWebhook {
    type: "generic-webhook";
    config?: IngestSourceOutGenericWebhookConfig;
}
interface IngestSourceOutCron {
    type: "cron";
    config: CronConfig;
}
interface IngestSourceOutAdobeSign {
    type: "adobe-sign";
    config: AdobeSignConfigOut;
}
interface IngestSourceOutBeehiiv {
    type: "beehiiv";
    config: SvixConfigOut;
}
interface IngestSourceOutBrex {
    type: "brex";
    config: SvixConfigOut;
}
interface IngestSourceOutCheckbook {
    type: "checkbook";
    config: CheckbookConfigOut;
}
interface IngestSourceOutClerk {
    type: "clerk";
    config: SvixConfigOut;
}
interface IngestSourceOutDocusign {
    type: "docusign";
    config: DocusignConfigOut;
}
interface IngestSourceOutEasypost {
    type: "easypost";
    config: EasypostConfigOut;
}
interface IngestSourceOutGithub {
    type: "github";
    config: GithubConfigOut;
}
interface IngestSourceOutGuesty {
    type: "guesty";
    config: SvixConfigOut;
}
interface IngestSourceOutHubspot {
    type: "hubspot";
    config: HubspotConfigOut;
}
interface IngestSourceOutIncidentIo {
    type: "incident-io";
    config: SvixConfigOut;
}
interface IngestSourceOutLithic {
    type: "lithic";
    config: SvixConfigOut;
}
interface IngestSourceOutNash {
    type: "nash";
    config: SvixConfigOut;
}
interface IngestSourceOutOrumIo {
    type: "orum-io";
    config: OrumIoConfigOut;
}
interface IngestSourceOutPandaDoc {
    type: "panda-doc";
    config: PandaDocConfigOut;
}
interface IngestSourceOutPortIo {
    type: "port-io";
    config: PortIoConfigOut;
}
interface IngestSourceOutPleo {
    type: "pleo";
    config: SvixConfigOut;
}
interface IngestSourceOutReplicate {
    type: "replicate";
    config: SvixConfigOut;
}
interface IngestSourceOutResend {
    type: "resend";
    config: SvixConfigOut;
}
interface IngestSourceOutRutter {
    type: "rutter";
    config: RutterConfigOut;
}
interface IngestSourceOutSafebase {
    type: "safebase";
    config: SvixConfigOut;
}
interface IngestSourceOutSardine {
    type: "sardine";
    config: SvixConfigOut;
}
interface IngestSourceOutSegment {
    type: "segment";
    config: SegmentConfigOut;
}
interface IngestSourceOutShopify {
    type: "shopify";
    config: ShopifyConfigOut;
}
interface IngestSourceOutSlack {
    type: "slack";
    config: SlackConfigOut;
}
interface IngestSourceOutStripe {
    type: "stripe";
    config: StripeConfigOut;
}
interface IngestSourceOutStych {
    type: "stych";
    config: SvixConfigOut;
}
interface IngestSourceOutSvix {
    type: "svix";
    config: SvixConfigOut;
}
interface IngestSourceOutZoom {
    type: "zoom";
    config: ZoomConfigOut;
}
interface IngestSourceOutTelnyx {
    type: "telnyx";
    config: TelnyxConfigOut;
}
interface IngestSourceOutVapi {
    type: "vapi";
    config: VapiConfigOut;
}
interface IngestSourceOutOpenAi {
    type: "open-ai";
    config: SvixConfigOut;
}
interface IngestSourceOutRender {
    type: "render";
    config: SvixConfigOut;
}
interface IngestSourceOutVeriff {
    type: "veriff";
    config: VeriffConfigOut;
}
interface IngestSourceOutAirwallex {
    type: "airwallex";
    config: AirwallexConfigOut;
}
export type IngestSourceOut = _IngestSourceOutFields & (IngestSourceOutGenericWebhook | IngestSourceOutCron | IngestSourceOutAdobeSign | IngestSourceOutBeehiiv | IngestSourceOutBrex | IngestSourceOutCheckbook | IngestSourceOutClerk | IngestSourceOutDocusign | IngestSourceOutEasypost | IngestSourceOutGithub | IngestSourceOutGuesty | IngestSourceOutHubspot | IngestSourceOutIncidentIo | IngestSourceOutLithic | IngestSourceOutNash | IngestSourceOutOrumIo | IngestSourceOutPandaDoc | IngestSourceOutPortIo | IngestSourceOutPleo | IngestSourceOutReplicate | IngestSourceOutResend | IngestSourceOutRutter | IngestSourceOutSafebase | IngestSourceOutSardine | IngestSourceOutSegment | IngestSourceOutShopify | IngestSourceOutSlack | IngestSourceOutStripe | IngestSourceOutStych | IngestSourceOutSvix | IngestSourceOutZoom | IngestSourceOutTelnyx | IngestSourceOutVapi | IngestSourceOutOpenAi | IngestSourceOutRender | IngestSourceOutVeriff | IngestSourceOutAirwallex);
export declare const IngestSourceOutSerializer: {
    _fromJsonObject(object: any): IngestSourceOut;
    _toJsonObject(self: IngestSourceOut): any;
};
export {};
