import { _decorator, Component, director, instantiate, Label, Layers, Node, Prefab, Sprite, SpriteFrame, tween, Tween, UITransform, v3, view } from 'cc';
// 虽然引入了配置，但我们下面会强制覆盖它
import { dialogInterval } from './GameConfig';
const { ccclass, property } = _decorator;

@ccclass('ThirdScene')
export class ThirdScene extends Component {
    @property(Label)
    timeLabel: Label = null;
    @property(Label)
    barLabel: Label = null;
    @property(SpriteFrame)
    dialogSp: SpriteFrame[] = [];
    @property(Node)
    mask: Node = null;
    @property(Node)
    endDialog: Node = null;
    @property(Node)
    content: Node = null;
    @property(Prefab)
    cube: Prefab = null;
    @property(Node)
    buildPoint: Node[] = [];

    images: Node[] = [];
    rightQue: number[] = [0, 0];
    
    private fallingItems: Node[] = [];
    private timerList: any[] = [];
    private timeID: any = -1; 
    
    // 状态锁
    private isQuitting: boolean = false;
    private isVictory: boolean = false; 
    
    timeCount: number = 0;
    spIndex: number = 0;
    currentNode: Node = null;

    private originalText: string = "...............................................";
    private targetText: string = "|||||||||||||||||||||||||||||||||||||||||||||||||";
    private totalLength: number = 49; 
    private isGameEnd: boolean = true;
    private timer: number = 0;

    start() {
        this.mask.active = false;
        this.isQuitting = false; 
        this.isVictory = false; 
        this.timerList = [];
        this.fallingItems = [];

        // 初始化图片
        for (let i = 0; i < this.dialogSp.length; i++) {
            let newNode = new Node();
            newNode.name = `${i + 1}`;
            newNode.layer = Layers.Enum.UI_2D;
            newNode.setPosition(-5 - (i * 15), -115 + (i * 15), 0);
            newNode.active = i < 3 ? true : false; 
            newNode.addComponent(Sprite).spriteFrame = this.dialogSp[i];
            newNode.getComponent(UITransform).setContentSize(375, 315);
            newNode.getComponent(UITransform).setAnchorPoint(0.5, 0);
            this.content.addChild(newNode);
            this.images.push(newNode);
        }
        this.images.sort((a, b) => { return b.position.y - a.position.y });
        for (let i = 0; i < this.images.length; i++) {
            let newNode = this.images[i];
            newNode.setSiblingIndex(i);
        }
        this.endDialog.active = false;
        
        this.timeID = setInterval(() => {
            this.updateDisplay();
        }, 1000);
        
        this.currentNode = this.images.pop();
        this.startProgress();
    }

    protected onDestroy(): void {
        this.isQuitting = true; 
        this.cleanupAll();      
    }

    private cleanupAll() {
        this.isGameEnd = false;
        Tween.stopAll(); 
        clearInterval(this.timeID);
        this.timerList.forEach(id => clearTimeout(id));
        this.timerList = [];
        
        this.fallingItems.forEach(item => {
            if (item && item.isValid) {
                Tween.stopAllByTarget(item);
                item.destroy();
            }
        });
        this.fallingItems = [];
    }

    private addTimer(callback: Function, delay: number) {
        if (this.isQuitting) return;
        const id = setTimeout(() => {
            if (this.isValid && !this.isQuitting) callback();
        }, delay);
        this.timerList.push(id);
    }

    private callPrinter(type: 'momo' | 'shred') {
        if (!this.isValid || this.isQuitting) return;
        if (this.isVictory && type === 'shred') return;

        const url = type === 'momo' ? "http://localhost:3000/print-momo" : "http://localhost:3000/print-shred";
        console.log(`🖨️ 发送指令: ${type}`);
        fetch(url).catch(e => console.log("打印机离线"));
    }

    startProgress() {
        if (!this.isValid || this.isQuitting || this.isVictory) return;
        Tween.stopAllByTarget(this);

        this.barLabel.string = this.originalText;
        this.totalLength = this.originalText.length;
        let currentLength = 0;
        
        // ⏱️ 进度条：3秒跑完
        tween(this)
            .to(4, {}, { 
                onUpdate: (target, ratio: number) => {
                    if (!this.isValid || this.isQuitting) return; 
                    const targetLength = Math.floor(ratio * this.totalLength);
                    if (targetLength !== currentLength) {
                        currentLength = targetLength;
                        this.updateLabel(targetLength);
                    }
                }
            })
            .call(() => {
                if (this.isValid && !this.isQuitting && !this.isVictory) this.startProgress(); 
            }).start();
    }

    updateLabel(currentLength: number) {
        let result = "";
        for (let i = 0; i < this.totalLength; i++) {
            if (i < currentLength) result += "|";
            else result += ".";
        }
        this.barLabel.string = result;
    }

    update(deltaTime: number) {
        if (this.isQuitting || this.isVictory) return;

        if (this.isGameEnd) {
            this.timer += deltaTime;
            
            // 🚨 强制修改：这里不读配置了，直接写死 3 秒！
            // 确保照片掉落间隔和进度条一模一样
            if (this.timer >= 4) { 
                this.timer = 0;
                for (let i = this.images.length - 1; i >= 0; i--) {
                    let newNode = this.images[i];
                    if (i >= (this.images.length - 3)) {
                        newNode.active = true;
                        tween(newNode).by(0.25, { position: v3(15, -15, 0) }).start();
                    } else {
                        newNode.position.add(v3(15, -15, 0));
                    }
                }
                
                const item = instantiate(this.currentNode);
                this.currentNode.parent.addChild(item);
                this.fallingItems.push(item);

                const mask = instantiate(this.mask);
                mask.name = this.currentNode.name;
                this.currentNode.parent.addChild(mask);
                mask.getChildByName('Sprite').setPosition(0, 0, 0);
                mask.getChildByName('Sprite').getComponent(Sprite).spriteFrame = item.getComponent(Sprite).spriteFrame;
                
                // 下落动画 0.5秒 (保持轻快)
                tween(item).to(0.5, { position: v3(0, -195.521, 0) }).call(() => {
                    const index = this.fallingItems.indexOf(item);
                    if (index > -1) this.fallingItems.splice(index, 1);

                    if (!this.isValid || this.isQuitting || this.isVictory) {
                        item.destroy(); 
                        return; 
                    }
                    item.destroy();
                    mask.active = true;
                    // 掉进碎纸机 -> 打印
                    this.startCut(mask); 
                }).start();
                
                if (this.currentNode) {
                    this.currentNode.destroy();
                    this.currentNode = null;
                }
                this.currentNode = this.images.pop();
            }
        }
    }

    updateDisplay() {
        this.timeCount += 1;
        const totalSeconds = Math.floor(this.timeCount);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.timeLabel.string = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
    }

    private pad(num: number, length: number = 2): string {
        let str = num.toString();
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    public onClickYes() {
        if (this.images.length <= 0) return;
        
        Tween.stopAllByTarget(this); 
        this.startProgress(); 
        
        if (this.currentNode.name == "6") this.rightQue[0] = 6;
        if (this.currentNode.name == "12") this.rightQue[1] = 12;

        if (this.currentNode) {
            this.currentNode.destroy();
            this.currentNode = null;
        }
        for (let i = this.images.length - 1; i >= 0; i--) {
            let newNode = this.images[i];
            if (i >= (this.images.length - 3)) {
                newNode.active = true;
                tween(newNode).by(0.5, { position: v3(15, -15, 0) }).start();
            } else {
                newNode.position.add(v3(15, -15, 0));
            }
        }
        this.currentNode = this.images.pop();

        if (this.rightQue[0] == 6 || this.rightQue[1] == 12) {
            // 🏆 胜利
            console.log("🏆 胜利！");
            this.cleanupAll(); 
            this.isVictory = true; 
            
            this.callPrinter('momo');

            this.endDialog.active = true;
            this.endDialog.getChildByName('success').active = true;
            this.endDialog.getChildByName('fail').active = false;
            this.endDialog.setScale(0, 0, 0);
            tween(this.endDialog).to(0.2, { scale: v3(1.15, 1.15, 1) }).to(0.1, { scale: v3(1, 1, 1) }).start();
            
            this.addTimer(() => {
                this.isQuitting = true;
                director.loadScene('game'); 
            }, 7000);

        } else {
            // ❌ 失败 (点错) -> B机惩罚打印
            console.log("❌ 失败 - 触发惩罚");
            this.callPrinter('shred');

            this.cleanupAll(); 
            this.isGameEnd = false; 

            this.endDialog.active = true;
            this.endDialog.getChildByName('success').active = false;
            this.endDialog.getChildByName('fail').active = true;
            this.endDialog.setScale(0, 0, 0);
            tween(this.endDialog).to(0.2, { scale: v3(1.15, 1.15, 1) }).to(0.1, { scale: v3(1, 1, 1) }).start();
        }
        this.timer = 0;
    }

    public onClickNo() {
        if (this.images.length <= 0) return;
        Tween.stopAllByTarget(this); 
        this.startProgress(); 
        
        for (let i = this.images.length - 1; i >= 0; i--) {
            let newNode = this.images[i];
            if (i >= (this.images.length - 3)) {
                newNode.active = true;
                tween(newNode).by(0.5, { position: v3(15, -15, 0) }).start();
            } else {
                newNode.position.add(v3(15, -15, 0));
            }
        }
        if (this.currentNode) {
            this.currentNode.destroy();
            this.currentNode = null;
        }
        this.currentNode = this.images.pop();
        this.timer = 0;
    }

    private startCut(_maks: Node) {
        if (!this.isValid || this.isQuitting || this.isVictory) return;

        // B 机自然碎纸
        this.callPrinter('shred');

        for (let t = 0; t < 3; t++) {
             const delay = t == 0 ? 0 : (t == 1 ? 500 : 750); 
             this.addTimer(() => {
                if (this.buildPoint) {
                    for (let i = 0; i < this.buildPoint.length; i++) {
                        const element = this.buildPoint[i];
                        for (let j = 0; j < 10; j++) {
                            const cube = instantiate(this.cube);
                            element.addChild(cube);
                        }
                    }
                }
             }, delay);
        }

        tween(_maks.getChildByName('Sprite')).to(1, { position: v3(0, -322.5, 0) }).call(() => {
            if (!this.isValid || this.isQuitting) return;
            _maks.destroy();
            if (this.images.length <= 0 && _maks.name == '20') {
                console.log("💀 耗尽失败");
                this.cleanupAll(); 
                this.endDialog.active = true;
                this.endDialog.getChildByName('success').active = false;
                this.endDialog.getChildByName('fail').active = true;
                this.endDialog.setScale(0, 0, 0);
                tween(this.endDialog).to(0.2, { scale: v3(1.15, 1.15, 1) }).to(0.1, { scale: v3(1, 1, 1) }).start();
            }
        }).start();
    }

    public onClickRest() {
        console.log("🔄 重置");
        this.isQuitting = true;
        this.cleanupAll();
        director.loadScene('game');
    }
}