import { DependencyContainer } from "tsyringe";

// SPT types
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import type {DynamicRouterModService} from "@spt-aki/services/mod/dynamicRouter/DynamicRouterModService";
import type {StaticRouterModService} from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { Money } from "@spt-aki/models/enums/Money";
import type { Item } from "@spt-aki/models/eft/common/tables/IItem";
import type { IWeaponBuild } from "@spt-aki/models/eft/profile/IAkiProfile";

// New trader settings
import { FluentAssortConstructor as FluentAssortCreator } from "./fluentTraderAssortCreator";

// SPT Dependencies
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { RagfairPriceService } from "@spt-aki/services/RagfairPriceService";
import { HashUtil } from "@spt-aki/utils/HashUtil";
// import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
// import { Traders } from "@spt-aki/models/enums/Traders";
// import { FenceService } from "@spt-aki/services/FenceService";
// import { ITrader, ITraderAssort } from "@spt-aki/models/eft/common/tables/ITrader";
// import { MyFenceService } from "./MyFenceService"
import { FenceService } from "@spt-aki/services/FenceService";

class Mod implements IPreAkiLoadMod
{
    private fluentAssortCreator: FluentAssortCreator

    public preAkiLoad(container: DependencyContainer): void 
    {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const hashUtil: HashUtil = container.resolve<HashUtil>("HashUtil");
        this.fluentAssortCreator = new FluentAssortCreator(hashUtil, logger);
        const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        // const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const ragfairPriceService = container.resolve<RagfairPriceService>("RagfairPriceService");
        const profileHelper: ProfileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        
        // container.register<MyFenceService>("MyFenceService", MyFenceService);
        // container.register("FenceService", {useToken: "MyFenceService"});
        const fenceService: FenceService = container.resolve<FenceService>("FenceService");

        staticRouterModService.registerStaticRouter(
            "StaticRoutePeekingAki",
            [
                {
                    //keeping it clean, but FENCE id is 579dc571d53a0658a154fbec
                    // url: `/client/trading/api/getTraderAssort/${Traders.FENCE}`,
                    url: "/client/game/start",
                    action: (url, info, sessionId, output) => 
                    {
                        logger.info("[AddPresetsToFence] injecting presets... ");

                        // Resolve SPT classes we'll use
                        const profile = profileHelper.getFullProfile(sessionId);

                        const count = this.addPresets(
                            ragfairPriceService, 
                            fenceService,
                            profile
                        )
                
                        logger.info(`Added ${count} presets to Fence`);

                        return output;
                    }
                }
            ],
            "aki"
        )

        // Hook up to existing AKI dynamic route
        dynamicRouterModService.registerDynamicRouter(
            "DynamicRoutePeekingAki",
            [
                {
                    //keeping it clean, but FENCE id is 579dc571d53a0658a154fbec
                    // url: `/client/trading/api/getTraderAssort/${Traders.FENCE}`,
                    url: "/client/builds/weapon/save",
                    // url: `/client/items/prices/${Traders.FENCE}`,
                    action: (url, info, sessionId, output) => 
                    {
                        logger.info("[AddPresetsToFence] injecting presets... ");

                        // Resolve SPT classes we'll use
                        const profile = profileHelper.getFullProfile(sessionId);

                        const count = this.addPresets(
                            ragfairPriceService, 
                            fenceService,
                            profile
                        )
                
                        logger.info(`Added ${count} presets to Fence`);

                        // const finalOutput = Object.assign({}, JSON.parse(output));
                        // finalOutput.data = iTraderAssort;

                        return output;
                    }
                }
            ],
            "aki"
        );
    }

    protected addPresets(ragfairPriceService, fenceService, profile): number {
        let count = 0;

        if (profile.userbuilds) 
        {
            const weaponBuilds = profile.userbuilds.weaponBuilds;

            if (weaponBuilds)
                weaponBuilds.forEach((preset: IWeaponBuild) => 
                {
                    const presetItems: Item[] = preset.Items;
                    this.fluentAssortCreator.createComplexAssortItem(presetItems)
                        .addMoneyCost(Money.ROUBLES, ragfairPriceService.getDynamicOfferPriceForOffer(presetItems, Money.ROUBLES, false)*.5)
                        .addBuyRestriction(5)
                        .addLoyaltyLevel(1)
                        .export((fenceService as any).fenceAssort);

                    count++;
                });
        }
        
        return count;
    }
}

module.exports = { mod: new Mod() }