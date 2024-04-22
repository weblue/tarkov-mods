import { DependencyContainer } from "tsyringe";

// SPT types
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
// import type {StaticRouterModService} from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import type {DynamicRouterModService} from "@spt-aki/services/mod/dynamicRouter/DynamicRouterModService";
import { Money } from "@spt-aki/models/enums/Money";
import type { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { ITraderAssort } from "@spt-aki/models/eft/common/tables/ITrader";
import type { IWeaponBuild } from "@spt-aki/models/eft/profile/IAkiProfile";

// New trader settings
import { FluentAssortConstructor as FluentAssortCreator } from "./fluentTraderAssortCreator";

// SPT Dependencies
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
// import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { RagfairPriceService } from "@spt-aki/services/RagfairPriceService";
import { HashUtil } from "@spt-aki/utils/HashUtil";

class Mod implements IPreAkiLoadMod
{
    private fluentAssortCreator: FluentAssortCreator

    public preAkiLoad(container: DependencyContainer): void 
    {
        const logger = container.resolve<ILogger>("WinstonLogger");
        // const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        const hashUtil: HashUtil = container.resolve<HashUtil>("HashUtil");
        this.fluentAssortCreator = new FluentAssortCreator(hashUtil, logger);
        const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");

        // Hook up to existing AKI dynamic route
        dynamicRouterModService.registerDynamicRouter(
            "DynamicRoutePeekingAki",
            [
                {
                    url: "/client/trading/api/getTraderAssort/579dc571d53a0658a154fbec",
                    action: (url, info, sessionId, output) => 
                    {
                        logger.info("[AddPresetsToFence] injecting presets... ");

                        // Resolve SPT classes we'll use
                        const RagfairPriceService = container.resolve<RagfairPriceService>("RagfairPriceService");
                        const profileHelper: ProfileHelper = container.resolve<ProfileHelper>("ProfileHelper");
                        const iTraderAssort: ITraderAssort = JSON.parse(output).data;
                
                        let count = 0; 
                
                        const profile = profileHelper.getFullProfile(sessionId);

                        if (profile.userbuilds) 
                        {
                            const weaponBuilds = profile.userbuilds.weaponBuilds;

                            if (weaponBuilds)
                                weaponBuilds.forEach((preset: IWeaponBuild) => 
                                {
                                    const presetItems: Item[] = preset.Items;
                                    this.fluentAssortCreator.createComplexAssortItem(presetItems)
                                        .addMoneyCost(Money.ROUBLES, RagfairPriceService.getDynamicOfferPriceForOffer(presetItems, Money.ROUBLES, false)*.5)
                                        .addBuyRestriction(5)
                                        .addLoyaltyLevel(1)
                                        .export(iTraderAssort);

                                    count++;
                                });
                        }
                
                        logger.info(`Added ${count} presets to Fence`);

                        const finalOutput = Object.assign({}, JSON.parse(output));
                        finalOutput.data = iTraderAssort;

                        return JSON.stringify(finalOutput);
                    }
                }
            ],
            "aki"
        );
    }
}

module.exports = { mod: new Mod() }