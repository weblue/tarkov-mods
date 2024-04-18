import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

class Mod implements IPostDBLoadMod {

    public postDBLoad(container: DependencyContainer): void {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        const tables = databaseServer.getTables()
        const logger = container.resolve<ILogger>("WinstonLogger");

        tables.templates.quests["5c51aac186f77432ea65c552"].conditions.AvailableForFinish.push(
            tables.templates.quests["5c51aac186f77432ea65c552"].conditions.AvailableForStart[0]
        )
        tables.templates.quests["5c51aac186f77432ea65c552"].conditions.AvailableForStart = [
            {
                "compareMethod": ">=",
                "conditionType": "Level",
                "dynamicLocale": false,
                "globalQuestCounterId": "",
                "id": "5d777f5d86f7742fa901bc77",
                "index": 0,
                "parentId": "",
                "value": 5,
                "visibilityConditions": [],
                "target": ""
            }
        ]

        logger.info("CollectorEarlyStart done")

    }
}

module.exports = { mod: new Mod() }