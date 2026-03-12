// 多级概率控制
export class MultiLevelRandom {
    // 数字分组
    private static normalNumbers: number[] = [];
    private static rareNumbers: number[] = [1, 5, 11, 12, 21, 24, 26, 30, 31, 32, 35];

    // 初始化普通数字数组（0-36中排除稀有数字）
    private static initNumbers(): void {
        this.normalNumbers = [];
        for (let i = 0; i <= 36; i++) {
            if (this.rareNumbers.indexOf(i) == -1) {
                this.normalNumbers.push(i);
            }
        }
    }

    /**
     * 获取随机数
     * @param rareChance 稀有数字出现几率（默认10%）
     */
    public static getRandom(rareChance: number = 0.1): number {
        // 懒初始化
        if (this.normalNumbers.length === 0) {
            this.initNumbers();
        }

        // 决定是否为稀有数字
        if (Math.random() < rareChance) {
            // 从稀有数字中随机
            const index = Math.floor(Math.random() * this.rareNumbers.length);
            return this.rareNumbers[index];
        } else {
            // 从普通数字中随机
            const index = Math.floor(Math.random() * this.normalNumbers.length);
            return this.normalNumbers[index];
        }
    }

    /**
     * 获取批量随机数
     * @param count 数量
     * @param rareChance 稀有数字几率
     */
    public static getRandomArray(count: number, rareChance: number = 0.1): number[] {
        const result: number[] = [];
        for (let i = 0; i < count; i++) {
            result.push(this.getRandom(rareChance));
        }
        return result;
    }
}