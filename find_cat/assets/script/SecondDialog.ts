import { _decorator, Component, director, Node } from 'cc';
import { ScondScene } from './ScondScene';
const { ccclass, property } = _decorator;

@ccclass('SecondDialog')
export class SecondDialog extends Component {

    @property
    isClick: boolean = false;

    protected onLoad(): void {
        if (this.isClick) {
            this.node.on(Node.EventType.TOUCH_END, this.click, this);
        }
    }

    protected onDestroy(): void {
        if (this.isClick) {
            this.node.off(Node.EventType.TOUCH_END, this.click, this);
        }
    }

    start() {

    }

    update(deltaTime: number) {

    }

    close() {
        const sdd = this.node.parent.parent.getComponent(ScondScene).usedPositions;
        for (let i = 0; i < sdd.length; i++) {
            const element = sdd[i];
            if (element == this.node) {
                this.node.parent.parent.getComponent(ScondScene).usedPositions.splice(i, 1);
                break;
            }
        }
        this.node.destroy();
    }

    click() {
        director.emit("AddScore", parseInt(this.node.name), this.node);
    }
}


