import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import config from '../config';
import * as fs from "fs-extra";
import * as path from 'path';
import log from './LogUtil';

const HISTORY_NAME = "history.json";


class MysqlUtil {
    public static pool: Database = null;

    static async createPool(mysqlConfig: any) {
        MysqlUtil.pool = await open({
            filename: path.join(config.rootPath, "database.db"),
            driver: sqlite3.Database
        });
        let basePath = path.join(config.rootPath, "sqls");
        let hisPath = path.join(basePath, HISTORY_NAME);
        let history: Array<string>;
        if (fs.existsSync(hisPath)) {
            history = JSON.parse(await fs.readFile(hisPath, "utf-8"));
        } else {
            history = new Array();
        }
        //执行数据库
        let files = (await fs.readdir(basePath)).sort((a, b) => a.localeCompare(b)).filter(item => !(item === HISTORY_NAME));
        let error = null;
        for (let i = 0; i < files.length; i++) {
            if (history.indexOf(files[i]) > -1) {
                log.info("sql无需重复执行:", files[i]);
                continue;
            }
            let sqlLines = (await fs.readFile(path.join(basePath, files[i]), 'utf-8')).split(/[\r\n]/g);
            try {
                let sql = "";
                for (let j = 0; j < sqlLines.length; j++) {
                    sql = sql + sqlLines[j];
                    if (sqlLines[j].endsWith(";")) {
                        await MysqlUtil.pool.exec(sql);
                        sql = "";
                    }
                }
                log.info("sql执行成功:", files[i]);
                history.push(files[i]);
            } catch (err) {
                error = err;
                break;
            }
        }
        await fs.writeFile(hisPath, JSON.stringify(history));
        if (error != null) {
            throw error;
        }
    }
}

export default MysqlUtil;
