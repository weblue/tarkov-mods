import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

class Mod implements IPostDBLoadMod {

    public postDBLoad(container: DependencyContainer): void {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        const tables = databaseServer.getTables()
        const logger = container.resolve<ILogger>("WinstonLogger");

        tables.globals.config.Stamina.SprintDrainRate = 4
        tables.globals.config.Stamina.BaseRestorationRate = 8
        tables.globals.config.Stamina.AimDrainRate = .8

        logger.info("RealisticStaminaRegen values changed")
    }
}

module.exports = { mod: new Mod() }