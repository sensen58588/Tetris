import {SHAPE_COORDS} from './Shape.js';
import * as RandomColor from './RandomColor.js';

cc.Class({
    extends: cc.Component,

    properties: {
        tilePrefab: cc.Prefab,
        shapeBoard: cc.Node,
        gameOverNode:cc.Node,
        restartNode:cc.Node,
        scoreLabel: cc.Label,
        canvasBG: cc.Sprite,
        // 音频
        bgAudio: {
            default: null,
            type: cc.AudioClip
        },
        btnAudio: {
            default: null,
            type: cc.AudioClip
        },
        dropAudio: {
            default: null,
            type: cc.AudioClip
        },
        pauseResumeAudio: {
            default: null,
            type: cc.AudioClip
        },
        removeAudio: {
            default: null,
            type: cc.AudioClip
        },
        loseAudio: {
            default: null,
            type: cc.AudioClip
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 行列数
        this.row = 21;
        this.col = 12;

        // 每个区域的宽高(即方块宽高)
        this.tileWidth = this.node.width / this.col;
        this.tileHeight = (this.node.height - 215) / this.row;

        // this.canvasBG.height = 3000;//this.node.height;
        // this.canvasBG.tileHeight = 3000;//this.node.height;

        // 确保添加方块的节点大小等于画布大小(不同机型适配)
        this.shapeBoard.width = this.node.width;
        this.shapeBoard.height = this.node.height - 215;

        // 方块节点池
        this.tilePool = new cc.NodePool();

        // 制作形状
        this.makeShape();

        //保存已经下落完毕的方块
        this.confirmedTileArray = [];

        // 添加计时器，让方块每秒往下移动一步
        this.schedule(this.moveDown, 1);
        this.restartNode.active = false;
        this.gameOverNode.active = false;

        //分数
        this.score = 0;
        // 播放背景音乐
        cc.audioEngine.playMusic(this.bgAudio, true);    
        cc.audioEngine.setMusicVolume(1);
        this.pauseGame = false;
        this.scoreLabel.string = "分数：0"

    },

    start () {

    },

    makeShape() {
        // 生成形状
        this.shapeTileArray = [];                                  // 用来保存当前形状中的所有方块
        this.color = this.getColor();                               // 当前形状颜色
        let startX = Math.floor(Math.random()*(this.col-4))+2;      // 横向起始位置
        let startY = 2;                                             // 纵向起始位置
        let x = startX * this.tileWidth;                            // 关键方块x坐标
        let y = startY * this.tileHeight;                           // 关键方块y坐标
        let keyTile = this.getTile();                               // 关键方块(旋转中心点)

        keyTile.color = this.color;
        keyTile.position = cc.v2(x, y);
        keyTile.width = this.tileWidth;
        keyTile.height = this.tileHeight;
        this.shapeBoard.addChild(keyTile);
        this.shapeTileArray.push(keyTile);

        let coords = this.getShapeCoords();                         // 随机获取一个形状坐标
        for (let i=1; i<coords.length; i++) {
            let x = (coords[i][0]+startX)*this.tileWidth;           // 其他方块相对于关键方块的x坐标
            let y = (coords[i][1]+startY)*this.tileHeight;          // 其他方块相对于关键方块的y坐标
    
            let tile = this.getTile();                              // 生成方块
            tile.color = this.color;
            tile.position = cc.v2(x, y);
            tile.width = this.tileWidth;
            tile.height = this.tileHeight;
            this.shapeBoard.addChild(tile);
            this.shapeTileArray.push(tile)
        }
    },

    getColor() {
        // 
        let _color = RandomColor.getRandomColor();
        return new cc.Color(_color[0], _color[1], _color[2]);
        // let red = Math.round(Math.random()*255);   
        // let green = Math.round(Math.random()*255);    
        // let blue = Math.round(Math.random()*255);    
        // return new cc.Color(red, green, blue);
    },

    getTile () {
        // 生成方块预制
        let tile = null;
        if (this.tilePool.size() > 0) {               // 如果节点池中有方块，那从节点池中获取
            tile = this.tilePool.get();
        }
        else {                                        // 否则调用cc.instantiate()生成
            tile = cc.instantiate(this.tilePrefab);
        }
        return tile;
    },

    getShapeCoords() {

        // 随机获取一种形状
        let shapeArray = ['squareShape','lineShape', 'tShape', 'zShape', 'zShapeMirror', 'lShape', 'lShapeMirror'];
        this.shape = shapeArray[Math.floor(Math.random()*shapeArray.length)];

        // 随机获取该形状的某种形态，形态的索引保存在this.num中
        let coordsArray = SHAPE_COORDS[this.shape];
        this.num = Math.floor(Math.random()*coordsArray.length);  
        // 返回坐标
        return coordsArray[this.num];
    },

    leftBtn() {
        if(this.pauseGame)
            return;
        // 左移
        cc.audioEngine.playEffect(this.btnAudio, false);
        for (let i=0; i<this.shapeTileArray.length; i++) {
            let x = Math.round(this.shapeTileArray[i].x - this.tileWidth);
            let y = Math.round(this.shapeTileArray[i].y);
            // 防止出界
            if (x < 0)  {
                return;
            }
            // 如果与其他方块重合，则不能移动
            for (let j=0; j<this.confirmedTileArray.length; j++) {
                let confirmedX = Math.round(this.confirmedTileArray[j].x);
                let confirmedY = Math.round(this.confirmedTileArray[j].y);
                if (confirmedX==x && confirmedY==y) {
                    return;
                }
            }
        }
        // 当前形状中的方块全部左移一步
        for (let i=0; i<this.shapeTileArray.length; i++) {
            this.shapeTileArray[i].x -= this.tileWidth;
        }
        
    },


    rightBtn() {
        if(this.pauseGame)
            return;
        // 右移
        cc.audioEngine.playEffect(this.btnAudio, false);
        for (let i=0; i<this.shapeTileArray.length; i++) {
            let x = Math.round(this.shapeTileArray[i].x + this.tileWidth);
            let y = Math.round(this.shapeTileArray[i].y);
            // 防止出界
            if (x >= this.shapeBoard.width)  {
                return;
            }
            // 如果与其他方块重合，则不能移动
            for (let j=0; j<this.confirmedTileArray.length; j++) {
                let confirmedX = Math.round(this.confirmedTileArray[j].x);
                let confirmedY = Math.round(this.confirmedTileArray[j].y);
                if (confirmedX==x && confirmedY==y) {
                    return;
                }
            }
        }
        // 当前形状中的方块全部右移一步
        for (let i=0; i<this.shapeTileArray.length; i++) {
            this.shapeTileArray[i].x += this.tileWidth;
        }
    },


    rotateBtn() {
        if(this.pauseGame)
            return;
        // 旋转
        cc.audioEngine.playEffect(this.btnAudio, false);
        // 如果形状只有一种变化形式，则直接返回
        let temp = this.num;
        if(SHAPE_COORDS[this.shape].length == 1) 
            return;
        else {
            if (this.num+1 == SHAPE_COORDS[this.shape].length) 
                this.num = 0;
            else 
                this.num += 1;
        }

        let keyTile = this.shapeTileArray[0];               // 获取关键方块
        let coords = SHAPE_COORDS[this.shape][this.num];    // 获取旋转后的坐标
        // 根据坐标重新设置其他三个方块
        for (let i=1; i<coords.length; i++) {
            let x = coords[i][0]*this.tileWidth + keyTile.x;
            let y = coords[i][1]*this.tileHeight + keyTile.y;
            let tile = this.shapeTileArray[i];      
            tile.position = cc.v2(x, y);
        }
        // 如果旋转后会超出边界或者与其他已存在的方块重合，则不旋转
        for (let i=1; i<coords.length; i++) {
            let x = Math.round(keyTile.x + coords[i][0]*this.tileWidth);
            let y = Math.round(keyTile.y + coords[i][1]*this.tileHeight);
            // 是否超出边界
            if (x<0 || x>=this.shapeBoard.width || Math.abs(y)>=this.shapeBoard.height) {
                if (x<0){
                    this.rightBtn();
                }
                else if (x>=this.shapeBoard.width){
                    this.leftBtn();
                }else{
                    this.num = temp;
                    return;
                }
                
            }
            // 如果与其他方块重合，则不旋转
            for (let j=0; j<this.confirmedTileArray.length; j++) {
                let confirmedX = Math.round(this.confirmedTileArray[j].x);
                let confirmedY = Math.round(this.confirmedTileArray[j].y);
                if (confirmedX == x && confirmedY == y) {
                    this.num = temp;
                    return;
                }
            }
        }
    },

    dropBtn() {
        if(this.pauseGame)
            return;
        // 下落
        cc.audioEngine.playEffect(this.btnAudio, false);
        while (true) {
            let temp = this.moveDown();
            if (!temp)
                return;
        }
    },


    moveDown () {
        if(this.pauseGame)
            return;
        // 往下移动一步
        cc.audioEngine.playEffect(this.dropAudio, false);
        for (let i=0; i<this.shapeTileArray.length; i++) {
            let x = Math.round(this.shapeTileArray[i].x);
            let y = Math.round(this.shapeTileArray[i].y - this.tileHeight);
            // 如果触底，则不再下降
            if (Math.abs(y) >= this.shapeBoard.height)  {
                this.shapeTileArray.forEach(element => {                // 将确定的方块放入this.confirmedTileArray
                    this.confirmedTileArray.push(element);
                });
                this.removeLines();
                this.makeShape();                                       // 重新生成形状
                return false;
            }

            // 如果与其他方块重合，则不再下降
            for (let j=0; j<this.confirmedTileArray.length; j++) {
                let confirmedX = Math.round(this.confirmedTileArray[j].x);
                let confirmedY = Math.round(this.confirmedTileArray[j].y);
                if (confirmedX==x && confirmedY==y) {
                    this.shapeTileArray.forEach(element => {            // 将确定的方块放入this.confirmedTileArray
                        this.confirmedTileArray.push(element);
                    });
                    if(this.judgeLose()) {
                        this.lose();
                    }else{
                        this.removeLines();
                        this.makeShape();                                   // 没输则重新生成形状
                    }                 
                    return false;
                }
            }
        }
        // 都没有问题的话，则当前形状中的方块全部下降
        for (let i=0; i<this.shapeTileArray.length; i++) {
            this.shapeTileArray[i].y -= this.tileHeight;
        }
        return true;
    },


    dropConfirmedTiles (lines) {
        // 让其他未消除的方块下落
        for (let i=0; i<lines.length; i++) {
            for (let j=0; j<this.confirmedTileArray.length; j++) {
                let confirmedY = Math.round(this.confirmedTileArray[j].y);
                // 只有消除行上方的方块才允许下降
                if (confirmedY <= -lines[i]*this.tileHeight)
                    continue;

                this.confirmedTileArray[j].y -= this.tileHeight;

            }
            // 增加分数
            this.addScore();
        }
        cc.audioEngine.playEffect(this.removeAudio, false);
    },


    removeLines() {
        // 消除
        let lines = [];                                 // 用于记录被消除的行编号(第几行)
        for (let i=0; i<this.row; i++) {
            let tempWidth = 0;                          // 用于判断是否进行消除
            let tempTile = [];                          // 存储某一行上要被消除的方块预制
            let y = Math.round(-i*this.tileHeight);     // 当前行的y值

            // 判断confirmedTileArray中方块的y值跟当前行的y值是否相同
            for (let j=0; j<this.confirmedTileArray.length; j++) {
                let confirmedY = Math.round(this.confirmedTileArray[j].y);
                if (y == confirmedY) {
                    tempTile.push(this.confirmedTileArray[j]);  // 如果相同则存储该方块
                    tempWidth += this.tileWidth;                // 并增加tempWidth值
                }
            }

            // 判断tempWidth值是否等于(或超过)shapeBoard的宽度，若超过，则说明该行已被填满
            if (tempWidth >= this.shapeBoard.width) {
                lines.push(i);
                tempTile.forEach(e=>{
                    // 从confirmedTileArray中删除相关方块
                    for (let j=0; j<this.confirmedTileArray.length; j++) {
                        if (e == this.confirmedTileArray[j]){
                            this.confirmedTileArray.splice(j, 1);
                        }
                            
                    }
                    this.tilePool.put(e);
                    // var anim = e.getComponent(cc.Animation);
                    // anim.play();
                                                     
                });
            }
        }
        // 让其他未消除的方块下落
        if (lines.length)
            this.dropConfirmedTiles(lines);
    },

    
    //游戏失败判断
    judgeLose() {
        for (let i=0; i<this.confirmedTileArray.length; i++) {
            let confirmedY = Math.round(this.confirmedTileArray[i].y);
            // 如果有任何一个方块超出顶端，则输
            if (confirmedY >= 0) 
                return true;
        }
        return false;
    },


    lose () {
        // 游戏失败
        this.unschedule(this.moveDown);             // 取消计时器
        this.gameOverNode.active = true;
        this.restartNode.active = true;             // 显示restart按钮
        cc.audioEngine.playEffect(this.loseAudio, false);
        this.pauseGame = true;
    },


    restart() {
        // 重新开始
        cc.director.loadScene('俄罗斯方块');
    },


    addScore() {
        // 分数+1
        this.score += 1;
        this.scoreLabel.string = "分数：" + String(this.score);
    },

    

    // update (dt) {},
});
