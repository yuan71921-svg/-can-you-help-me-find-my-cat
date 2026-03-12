// FallingImage.ts - 单个下落图片组件
import { _decorator, Component, Sprite, SpriteFrame, randomRange, v3, tween, Node, view, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FallingImage')
export class FallingImage extends Component {
    @property(Label)
    sprite: Label = null!;

    // 下落速度范围
    @property
    minSpeed: number = 100;
    @property
    maxSpeed: number = 300;

    // 旋转速度范围
    @property
    minRotationSpeed: number = 45;
    @property
    maxRotationSpeed: number = 180;

    // 晃动幅度
    @property
    swingRange: number = 50;

    private speed: number = 0;
    private rotationSpeed: number = 0;
    private swingOffset: number = 0;
    private swingSpeed: number = 0;

    onLoad() {
        this.reset();
    }

    reset() {
        const sdd = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o'];
        this.sprite.string = sdd[Math.floor(Math.random() * (sdd.length - 0)) + 0];

        // 随机初始位置（屏幕顶部区域）
        const screenWidth = 100; // 根据实际屏幕调整
        this.node.setPosition(
            randomRange(-screenWidth / 2, screenWidth / 2),
            0, // 起始高度
            0
        );

        // 随机速度
        this.speed = randomRange(this.minSpeed, this.maxSpeed);

        // 随机旋转速度
        this.rotationSpeed = randomRange(
            this.minRotationSpeed,
            this.maxRotationSpeed
        ) * (Math.random() > 0.5 ? 1 : -1);

        // 随机摆动参数
        this.swingOffset = randomRange(0, Math.PI * 2);
        this.swingSpeed = randomRange(0.5, 2);

        // 随机缩放
        const scale = randomRange(0.3, 1.0);
        this.node.setScale(scale, scale, 1);
    }

    update(dt: number) {
        // 下落
        const pos = this.node.position;
        const newY = pos.y - this.speed * dt;

        // 水平摆动
        const swingX = Math.sin(this.swingOffset + Date.now() * 0.001 * this.swingSpeed) * this.swingRange;

        this.node.setPosition(
            pos.x /*+ swingX * dt*/,
            newY,
            0
        );

        // 旋转
        //this.node.angle += this.rotationSpeed * dt;

        // 超出屏幕底部则重置
        if (newY < -view.getVisibleSize().height / 2) {
            this.node.destroy();
        }
    }
}