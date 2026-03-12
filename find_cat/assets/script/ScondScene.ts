import { _decorator, Component, director, instantiate, Label, Node, Prefab, randomRange, tween, UITransform, v3, Vec2, Vec3, view } from 'cc';
import { MultiLevelRandom } from './MultiLevelRandom';
import { buildInterval } from './GameConfig';
import { DropItem } from './DropItem'; 
const { ccclass, property } = _decorator;

@ccclass('ScondScene')
export class ScondScene extends Component {

    @property(Label)
    topLabel: Label = null;

    @property(Label)
    numLabel: Label = null;

    @property(Node)
    dialogParent: Node = null;

    @property(Node)
    endDialog: Node = null;

    @property(Prefab)
    dialogs: Prefab[] = [];

    private readonly topWord: string = "[SYS _HUD]  >>  CPU:    98.9%      [OVERLOAD]  |  |   DATA:   0%   RECOVERED      | |  TIME_REMAINING:    [ 00:00:00]     ||              TARGET_STATUS:     MISSING...       | |     [ALERT_LVL 5]";
    private readonly rightTag: number[] = [
        1, 5, 11, 12, 21, 24, 26, 30, 31, 32, 35
    ]
    interval: number = 0.05;

    private updataID: any = -1;
    private buildID: any = -1;
    private fullText: string = '';
    private currentIndex: number = 0;
    private isTyping: boolean = false;
    private dataNum: number = 0;
    private elapsedTime: number = 0;
    private hasWon: boolean = false; 

    protected onLoad(): void {
        director.on('AddScore', this.addScore, this);
    }
    
    protected onDestroy(): void {
        director.off('AddScore', this.addScore, this);
        this.cleanupAll();
    }

    private cleanupAll() {
        clearInterval(this.updataID);
        clearInterval(this.buildID);
        if (this.dialogParent && this.dialogParent.isValid) {
            this.dialogParent.removeAllChildren();
        }
    }

    start() {
        this.hasWon = false; 
        this.startTyping(this.topWord);
    }

    update(deltaTime: number) { }

    public startTyping(text: string) {
        if (this.isTyping) return; 
        this.numLabel.node.active = false;
        this.endDialog.active = false;
        this.fullText = text;
        this.currentIndex = 0;
        this.isTyping = true;
        this.topLabel!.string = ''; 
        this.schedule(this.onTypeChar, this.interval, this.fullText.length - 1, 0);
    }

    private onTypeChar() {
        if (this.currentIndex < this.fullText.length) {
            this.topLabel!.string += this.fullText[this.currentIndex];
            this.currentIndex++;
        }
        if (this.currentIndex >= this.fullText.length) {
            this.isTyping = false;
            this.unschedule(this.onTypeChar);
            this.numLabel.node.active = true;
            tween(this.numLabel.node).to(0.5, { scale: v3(1.15, 1.15, 1) }).to(0.5, { scale: v3(1, 1, 1) }).union().repeatForever().start();

            this.updataID = setInterval(() => {
                this.elapsedTime++;
                this.showCurrentGameData();
            }, 1000);
            this.showCurrentGameData();

            // 🚀 保持 2秒一波 (适合触摸屏)
            this.buildID = setInterval(() => {
                // 💥 数量爆发：1 到 10 个
                const batchCount = Math.floor(Math.random() * 10) + 1; 
                for (let k = 0; k < batchCount; k++) {
                    this.buildDialog();
                }
            }, 2000); 
        }
    }

    private showCurrentGameData() {
        const totalSeconds = Math.floor(this.elapsedTime);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.topLabel!.string = `[SYS _HUD]  >>  CPU:    ${(Math.random() * 100).toFixed(1)}%      [OVERLOAD]  |  |   DATA:             RECOVERED      | |  TIME_REMAINING:    [${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}]     ||   TARGET_STATUS:     MISSING...       | |     [ALERT_LVL 5]`;
        this.numLabel.string = `${this.dataNum}%`;
    }

    private pad(num: number, length: number = 2): string {
        let str = num.toString();
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    usedPositions: Node[] = [];

    private buildDialog() {
        if (this.hasWon) return; 

        const randomNum = MultiLevelRandom.getRandom(0.3); 
        const tag = randomNum;
        const dialog = instantiate(this.dialogs[tag]);
        this.dialogParent.addChild(dialog);
        
        const dropItem = dialog.getComponent(DropItem);
        if (dropItem) {
            dropItem.setPrintStatus(false); 
        }

        dialog.setScale(0, 0, 0);

        const visibleSize = view.getVisibleSize();
        const contentSize = dialog.getComponent(UITransform).contentSize;

        const minX = -(visibleSize.width / 2 - contentSize.width / 2);
        const maxX = (visibleSize.width / 2) - (contentSize.width / 2);
        const minY = -(visibleSize.height * 0.8 / 2 - contentSize.height / 2);
        const maxY = visibleSize.height * 0.8 / 2 - contentSize.height / 2;

        let randomX = minX + Math.random() * (maxX - minX);
        let randomY = minY + Math.random() * (maxY - minY);

        for (let i = 0; i < 20; i++) {
            let valid = true;
            for (const used of this.usedPositions) {
                if (Vec3.distance(new Vec3(randomX, randomY, 0), used.getPosition()) < 50) {
                    valid = false;
                    break;
                }
            }
            if (!valid) {
                randomX = minX + Math.random() * (maxX - minX);
                randomY = minY + Math.random() * (maxY - minY);
            } else {
                break;
            }
        }
        dialog.setPosition(randomX, randomY);

        // 大小：只小不大 (0.4 - 0.85)
        const randomScale = 0.4 + Math.random() * 0.45;

        tween(dialog)
            .to(0.2, { scale: v3(randomScale + 0.1, randomScale + 0.1, 1) }) 
            .to(0.1, { scale: v3(randomScale, randomScale, 1) }) 
            .start();
    }

    private addScore(tag: number, _node: Node) {
        let isObscured = false;
        let _index = 0;
        
        // 1. 找到当前点击节点在列表中的位置
        for (let i = 0; i < this.dialogParent.children.length; i++) {
            if (this.dialogParent.children[i] == _node) {
                _index = i;
                break;
            }
        }

        // 2. 🛡️ 遮挡检测
        // 检查所有在它上面的节点 (index 更大的节点)
        for (let i = _index + 1; i < this.dialogParent.children.length; i++) {
            const element = this.dialogParent.children[i];
            let blockerRect = element.getComponent(UITransform).getBoundingBox();
            
            // 这里我们用 80% 的区域判定遮挡 (正常判定)
            // 因为现在的逻辑是：如果被挡住了，就弹出来，而不是不能点
            // 所以判定可以稍微大一点点，让“置顶”这个功能更容易触发
            blockerRect.width *= 0.8;
            blockerRect.height *= 0.8;
            blockerRect.x += blockerRect.width * 0.1; 
            blockerRect.y += blockerRect.height * 0.1;

            if (_node.getComponent(UITransform).getBoundingBox().intersects(blockerRect)) {
                isObscured = true;
                break;
            }
        }

        // 🎯 核心交互逻辑修改
        if (isObscured) {
            // ✨ 如果被压住了：跳到最前面！
            console.log("🆙 窗口置顶！");
            
            // 1. 把它移到子节点列表的最后面 (也就是最上层)
            _node.setSiblingIndex(this.dialogParent.children.length - 1);
            
            // 2. 播放一个 Q 弹的动画，提示用户“我上来了”
            const currentScale = _node.scale.x;
            tween(_node)
                .to(0.1, { scale: v3(currentScale * 1.1, currentScale * 1.1, 1) })
                .to(0.1, { scale: v3(currentScale, currentScale, 1) })
                .start();

            // 🛑 关键：这次点击只负责置顶，不负责消除/加分！
            return; 
        }

        // ———— 下面是“没被遮挡”时的逻辑 (消除/加分) ————

        if (this.rightTag.indexOf(tag) != -1) {
            // 是正确的目标
            const sdd = this.usedPositions;
            for (let i = 0; i < sdd.length; i++) {
                const element = sdd[i];
                if (element == _node) {
                    this.usedPositions.splice(i, 1);
                    break;
                }
            }

            _node.destroy();
            this.dataNum += 10;
            this.showCurrentGameData();

            if (this.dataNum >= 100 && !this.hasWon) {
                this.hasWon = true; 
                clearInterval(this.updataID);
                clearInterval(this.buildID);
                
                if (this.dialogParent && this.dialogParent.isValid) {
                    this.dialogParent.removeAllChildren();
                }
                
                this.endDialog.active = true;
                this.endDialog.setScale(0, 0, 0);
                tween(this.endDialog).to(0.2, { scale: v3(1.15, 1.15, 1) }).to(0.1, { scale: v3(1, 1, 1) }).start();
            }
        } else {
             // 是垃圾弹窗，直接销毁
             _node.destroy();
        }
    }

    public onClickClose() {
        this.cleanupAll();
        this.node.destroy();
        const canvas = director.getScene().getChildByName('Canvas');
        if (canvas && canvas.getChildByName('thirdBg')) {
             canvas.getChildByName('thirdBg').active = true;
        }
    }
}