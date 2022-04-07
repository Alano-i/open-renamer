import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';

import ProcessHelper from '../util/ProcesHelper';
import FileObj from '../vo/FileObj';

let numberSet = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

class FileService {
	static async readPath(pathStr: string, showHidden: boolean): Promise<Array<FileObj>> {
		pathStr = decodeURIComponent(pathStr);
		let fileList = new Array();
		if (pathStr.trim().length == 0) {
			//获取根目录路径
			if (config.isWindows) {
				//windows下
				let std: string = (await ProcessHelper.exec('wmic logicaldisk get caption')).replace('Caption', '');
				fileList = std
					.split('\r\n')
					.filter((item) => item.trim().length > 0)
					.map((item) => item.trim());
			} else {
				//linux下
				pathStr = '/';
				fileList = await fs.readdir(pathStr);
			}
		} else {
			fileList = await fs.readdir(pathStr);
		}
		let folderList: Array<FileObj> = new Array();
		let files: Array<FileObj> = new Array();
		for (let index in fileList) {
			try {
				let stat = await fs.stat(path.join(pathStr, fileList[index]));
				if (fileList[index].startsWith('.')) {
					if (showHidden) {
						(stat.isDirectory() ? folderList : files).push(
							new FileObj(fileList[index], pathStr, stat.isDirectory(), stat.birthtime.getTime(), stat.mtime.getTime()),
						);
					}
				} else {
					(stat.isDirectory() ? folderList : files).push(
						new FileObj(fileList[index], pathStr, stat.isDirectory(), stat.birthtime.getTime(), stat.mtime.getTime()),
					);
				}
			} catch (e) {
				console.error(e);
			}
		}
		folderList.sort((a, b) => FileService.compareStr(a.name, b.name)).push(...files.sort((a, b) => FileService.compareStr(a.name, b.name)));
		return folderList;
	}

	static async checkExist(pathStr: string) {
		return await fs.pathExists(pathStr);
	}

	/**
	 * 数字字母混合排序
	 * @param a str
	 * @param b str
	 */
	static compareStr(a: string, b: string) {
		let an = a.length;
		let bn = b.length;
		for (let i = 0; i < an;) {
			let charA = FileService.readChar(a, i, an);
			let charB = FileService.readChar(b, i, bn);
			if (charB.length == 0) {
				return 1;
			}
			if (charA !== charB) {
				//读取字符串不相等说明可以得到排序结果
				//如果都为数字，按照数字的比较方法，否则按照字符串比较
				return numberSet.has(charA.charAt(0)) && numberSet.has(charB.charAt(0)) ? Number(charA) - Number(charB) : charA.localeCompare(charB);
			}
			i += charA.length;
		}
		//排到最后都没分结果说明相等
		return 0;
	}

	/**
	 * 读取字符，如果字符为数字就读取整个数字
	 * @param a a
	 * @param n 数字长度
	 */
	static readChar(a: string, i: number, n: number) {
		let res = "";
		for (; i < n; i++) {
			let char = a.charAt(i);
			if (numberSet.has(char)) {
				//如果当前字符是数字，添加到结果中
				res += char;
			} else {
				//如果不为数字，但是为第一个字符，直接返回，否则返回res
				if (res.length == 0) {
					return char;
				} else {
					return res;
				}
			}
		}
		return res;
	}
}

export default FileService;
