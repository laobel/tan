/**
 * 克隆Cartesian3数组
 *
 * @param positions
 */
function cartesian3ArrayClone(positions) {
    if(!Cesium.defined(positions)||positions.length<=0){
        return [];
    }

    return Cesium.Cartesian3.unpackArray(Cesium.Cartesian3.packArray(positions));
}

/**
 * 生成唯一id类
 */
var uid=(function () {
    function _(str) {
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.";
        uuid = uuid.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid + str;
    }

    return _;
})();

/**
 * 自定义面实体类
 */
var CustomPolygonEntity=(function () {
    function _(viewer,positions,options) {
        this._viewer=viewer;
        options=Cesium.defined(options)?options:{};

        this._polygonOptions={
            heightReference:Cesium.HeightReference.CLAMP_TO_GROUND,
            material:Cesium.defined(options.material)?options.material:new Cesium.Color(1.0, 0.0, 1.0, 0.0)
        };

        //高亮材质
        this._materialH=Cesium.defined(options.materialH)?options.materialH:new  Cesium.Color(1.0, 0.0, 1.0, 0.4);

        this.id=uid('custompolygon');
        this.positions=positions;
        this.attributes=options.attributes;

        var that=this;
        var polygonCBP=function () {
            return that.positions;
        };
        this._polygonOptions.hierarchy=new Cesium.CallbackProperty(polygonCBP, false);
        this._polygonOptions.classificationType=Cesium.ClassificationType.BOTH;

        this.entity=this._viewer.entities.add({
            id:this.id,
            polygon:new Cesium.PolygonGraphics(this._polygonOptions)
        });
    }

    /**
     * 高亮
     */
    _.prototype.highlight=function () {
        this.entity.polygon.material=this._materialH;
    };

    /**
     * 取消高亮
     */
    _.prototype.unHighlight=function () {
        this.entity.polygon.material=this._polygonOptions.material;
    };

    return _;
})();

/**
 * 提示工具条类
 */
var ToolTips=(function () {
    function _(container) {

        var panel = document.createElement('DIV');
        panel.className = "tooltips right";

        var arrow = document.createElement('DIV');
        arrow.className = "tooltips-arrow";
        panel.appendChild(arrow);

        var title = document.createElement('DIV');
        title.className = "tooltips-inner";
        panel.appendChild(title);

        this._panel = panel;
        this._title=title;

        this._position=undefined;

        container.appendChild(panel);
    }

    /**
     * 显示提示
     * @param message 提示信息
     * @param position 显示位置，屏幕坐标
     */
    _.prototype.showAt=function (message,position) {
        if (position) {
            this._position=position;

            this.show();

            this._panel.style.left = this._position.x + 10 + "px";
            this._panel.style.top = (this._position.y - this._panel.clientHeight / 2) + "px";
        }
        if(message){
            this._title.innerHTML = message;
        }
    };

    _.prototype.show=function () {
        this._panel.style.display = "block";
    };

    _.prototype.hide=function () {
        this._panel.style.display = "none";
    };

    return _;
})();


/**
 * 绘制辅助类
 */
var DrawHelper=(function () {

    function leftClickEvent(drawHelper,ev) {
        var that=drawHelper;
        var pos=that._getMousePos(ev.position);
        if(!Cesium.defined(pos)){
            return;
        }

        if(that._drawable){
            if(!Cesium.Cartesian3.equals(that._positions[that._positions.length-1],pos.clone())){  //重点过滤，达到避免双击重点
                that._positions.push(pos.clone());
            }
        }else if(that._selectable){
            if(Cesium.defined(that._pickObj)){
                that._pickObj.unHighlight();
            }

            if(Cesium.defined(that._selectedObj)){
                that._selectedObj.unHighlight();
            }

            that._selectedObj=that._getPickObj(ev.position);
            if(Cesium.defined(that._selectedObj)){
                that._selectedObj.highlight();
            }


            if(Cesium.defined(that._selectChangedCallback)){
                that._selectChangedCallback(that._selectedObj);
            }
        }else {
            if(Cesium.defined(that._oLeftClickEvent)){
                that._oLeftClickEvent(ev);
            }
        }
    }

    function leftDbClickEvent(drawHelper,ev) {
        var that=drawHelper;
        var pos=that._getMousePos(ev.position);
        if(!Cesium.defined(pos)){
            return;
        }

        if(that._drawable){
            if(that._positions.length>=3){
                that.customPolygons.push(that._currentCustomPolygon);

                if(Cesium.defined(that._drawFinishedCallback)){
                    that._drawFinishedCallback(that._getCustomPolygonById(that._currentCustomPolygon.id));
                }
            }else {
                that._viewer.entities.remove(that._currentCustomPolygon.entity);
            }

            that._positions=[];
            that._currentCustomPolygon=undefined;
        }else {
            if(Cesium.defined(that._oLeftDbClickEvent)){
                that._oLeftDbClickEvent(ev);
            }
        }
    }

    function mouseMoveEvent(drawHelper,ev) {
        var that=drawHelper;

        var pos=that._getMousePos(ev.endPosition);
        if(!Cesium.defined(pos)){
            return;
        }

        if(that._drawable){
            var len=that._positions.length;

            switch (len) {
                case 0:
                    that._toolTips.showAt('单击绘制面的起点',ev.endPosition);
                    break;
                case 1:
                    that._toolTips.showAt('单击绘制面的第2个节点',ev.endPosition);
                    break;
                default:
                    that._toolTips.showAt('单击添加面的节点，双击结束绘制',ev.endPosition);
                    var positions=cartesian3ArrayClone(that._positions);
                    positions.push(pos.clone());
                    if(Cesium.defined(that._currentCustomPolygon)){
                        that._currentCustomPolygon.positions=positions;
                    }else {
                        that._currentCustomPolygon=new CustomPolygonEntity(that._viewer,positions,{
                            material:new Cesium.Color(1.0, 0.0, 1.0, 0.4)
                        });
                    }

                    break;
            }
        }else if(that._selectable){
            if(Cesium.defined(that._pickObj)  && (!Cesium.defined(that._selectedObj)|| that._pickObj.id!==that._selectedObj.id)){
                that._pickObj.unHighlight();
            }

            that._pickObj=that._getPickObj(ev.endPosition);
            if(Cesium.defined(that._pickObj)){
                that._pickObj.highlight();
            }
        }else {
            if(Cesium.defined(that._oMouseMoveEvent)){
                that._oMouseMoveEvent(ev);
            }
        }
    }

    function _(viewer,drawFinishedCallback,selectChangedCallback) {
        this._viewer=viewer;
        this._drawFinishedCallback=drawFinishedCallback;
        this._selectChangedCallback=selectChangedCallback;

        this._drawable=false;
        this._selectable=false;

        this._positions=[];

        this.customPolygons=[];
        this._currentCustomPolygon=undefined;
        this._pickObj=undefined;
        this._selectedObj=undefined;

        this._toolTips=new ToolTips(this._viewer.canvas.parentNode);

        this._initHandler();
    }

    _.prototype.startDraw=function(){
        this._drawable=true;
    };

    _.prototype.stopDraw=function(){
        this._drawable=false;
        this._toolTips.hide();
    };

    _.prototype.addCustomPolygon=function(customPolygon){
        if(customPolygon instanceof CustomPolygonEntity){
            this.customPolygons.push(customPolygon);
        }
    };

    _.prototype._initHandler=function () {
        var that=this;
        var handler=this._viewer.screenSpaceEventHandler;

        //记录原始事件
        this._oLeftClickEvent=handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this._oLeftDbClickEvent=handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this._oMouseMoveEvent=handler.getInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        //移除原始事件
        handler.removeInputAction( Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction( Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        handler.removeInputAction( Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        //绑定新事件
        handler.setInputAction(function (ev) {
            leftClickEvent(that,ev);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(function (ev) {
            leftDbClickEvent(that,ev);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        handler.setInputAction(function (ev) {
            mouseMoveEvent(that,ev);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };

    _.prototype._getCustomPolygonById=function(id){
        for(var i=0;i<this.customPolygons.length;i++){
            if(this.customPolygons[i].entity.id===id){
                return this.customPolygons[i];
            }
        }
        return undefined;
    };

    _.prototype._getPickObj=function(windowPosition){
        var pickObj=this._viewer.scene.pick(windowPosition);

        if(!Cesium.defined(pickObj)||!Cesium.defined(pickObj.id)){
            return undefined;
        }

        return this._getCustomPolygonById(pickObj.id.id);
    };

    _.prototype._getMousePos=function (windowPosition) {
        var scene=this._viewer.scene;

        /*scene.render();
        var pos=scene.pickPosition(windowPosition);*/

        var ray = scene.camera.getPickRay(windowPosition);
        var pos = scene.globe.pick(ray, scene);
        pos = Cesium.defined(pos) ? pos : scene.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);

        return pos;
    };

    return _;
})();


