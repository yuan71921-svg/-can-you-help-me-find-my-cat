import { _decorator, Component, director, instantiate, Label, Node, Prefab, randomRange, UITransform, Vec3, tween } from 'cc';
import { DropItem } from './DropItem';
const { ccclass, property } = _decorator;

@ccclass('MainScene')
export class MainScene extends Component {
    @property({ type: Prefab })
    public prefab: Prefab | null = null; // 拖入预制体
    @property(Label)
    topLabel: Label = null;

    private spawnInterval: number = 1.0; // 每隔1秒生成一个
    private dropSpeed: number = 50;      // 下落速度

    timeID: any = -1;
    timeCount: number = 0;

    start() {
        if (this.prefab) {
            this.schedule(this.spawnDrop, this.spawnInterval);
        }
        const _time = new Date();
        this.timeCount = _time.getHours() * 3600 + _time.getMinutes() * 60 + _time.getSeconds();
        this.updateDisplay();
        
        this.timeID = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    spawnDrop() {
        if (!this.prefab) return;
        const newDrop = instantiate(this.prefab);
        this.node.addChild(newDrop);
        
        // 获取屏幕尺寸
        const uiTrans = director.getScene().getChildByName('Canvas')?.getComponent(UITransform);
        const canvasWidth = uiTrans ? uiTrans.width : 1280;
        
        // 🛑 还原你的位置逻辑 1：X轴范围减去 300
        const startX = randomRange(-canvasWidth / 2, canvasWidth / 2 - 300);
        
        // 🛑 还原你的位置逻辑 2：Y轴高度乘以 0.8 (确保从你想要的高度掉下来)
        // 如果 uiTrans 获取不到，默认用 300 做保底
        const startY = uiTrans ? uiTrans.height / 2 * 0.8 : 300; 

        newDrop.setPosition(new Vec3(startX, startY, 0)); 

        // 🛑 关键点：传入 false，告诉 DropItem "这是主页，别打印！"
        // (前提是你的 DropItem.ts 已经改好了支持这个参数)
        newDrop.addComponent(DropItem).init(this.dropSpeed, false);
    }

    onClickStart() {
        this.unschedule(this.spawnDrop);
        clearInterval(this.timeID);
        
        this.node.destroy(); // 销毁当前界面
        
        // 显示二级背景或进入游戏
        const canvas = director.getScene().getChildByName('Canvas');
        if(canvas && canvas.getChildByName('scondBg')) {
             canvas.getChildByName('scondBg').active = true;
        }
    }

    updateDisplay() {
        if (!this.topLabel) return;
        this.timeCount += 1;
        const totalSeconds = Math.floor(this.timeCount);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.topLabel.string = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
    }

    private pad(num: number, length: number = 2): string {
        let str = num.toString();
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }
    
    protected onDestroy(): void {
        clearInterval(this.timeID);
        this.unschedule(this.spawnDrop);
    }
}