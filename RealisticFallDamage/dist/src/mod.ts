import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

class Mod implements IPostDBLoadMod {

    public postDBLoad(container: DependencyContainer): void {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        const tables = databaseServer.getTables()
        const logger = container.resolve<ILogger>("WinstonLogger");

        tables.globals.config.Health.Falling.DamagePerMeter = 7;
        tables.globals.config.Health.Falling.SafeHeight = 4;

        logger.info("RealisticFallDamage done")
    }
}

module.exports = { mod: new Mod() }