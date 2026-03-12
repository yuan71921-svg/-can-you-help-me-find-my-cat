import { _decorator, Component, Label, Node } from 'cc';
import { StartWords } from './GameConfig'; // 👈 1. 这一行必须打开，不然没字！
const { ccclass, property } = _decorator;

@ccclass('DropItem')
export class DropItem extends Component {
   private speed: number = 0;
   private isDead: boolean = false;
   
   // 🛑 默认允许打印 (true)
   private canPrint: boolean = true; 

   // 🛑 init 接收第二个参数
   init(speed: number, canPrint: boolean = true) {
       this.speed = speed;
       this.canPrint = canPrint; 

       // ✅ 2. 找回文字显示逻辑！
       // 如果没有这几行，掉下来的就是空的或者默认字
       if (StartWords && StartWords.length > 0) {
           const label = this.getComponent(Label);
           if (label) {
               label.string = StartWords[Math.floor(Math.random() * StartWords.length)];
           }
       }
   }

   update(dt: number) {
       if (this.isDead) return;

       const pos = this.node.getPosition();
       const newY = pos.y - this.speed * dt;
       this.node.setPosition(pos.x, newY, pos.z);

       // 掉出屏幕底部
       if (newY < -400) { 
           this.isDead = true;

           // 🛑 3. 只有开关打开时，才呼叫打印机！
           if (this.canPrint) {
               console.log("❌ [游戏内] 物品掉落！呼叫 B 机...");
               fetch("http://localhost:3000/print-shred").catch(e => {}); 
           } 
           // else { 主页掉落：静音，什么都不做 }
           
           this.node.destroy();
       }
   }
}