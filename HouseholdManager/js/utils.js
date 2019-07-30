
/**
 * 根据边界计算重心
 * @param boundary
 * @return {number[]}
 */
function getCenterOfGravityPoint(boundary) {
    var  x1=boundary[0],y1=boundary[1],z1=boundary[2],x2,y2,z2,x3,y3,z3;
    var sum_x=0,sum_y=0,sum_s=0,z=-1000000000;

    for(var i=3;i<boundary.length-3;i+=3){
        x2=boundary[i];
        y2=boundary[i+1];
        z2=boundary[i+2];
        x3=boundary[i+3];
        y3=boundary[i+4];
        z3=boundary[i+5];

        z=Math.max(z,z1,z2,z3);

        var s=((x2-x1)*(y3-y1)-(x3-x1)*(y2-y1))/2.0;
        sum_x+=(x1+x2+x3)*s;
        sum_y+=(y1+y2+y3)*s;
        sum_s+=s;
    }

    return [sum_x/sum_s/3.0,sum_y/sum_s/3.0,z];
}

/**
 * 通过id获取楼栋数据
 *
 * @param {Object[]} datas 建筑物数据
 * @param {string} id 楼栋id
 * @return {undefined|Object}
 */
function getBuildingData(datas,id) {
    for(var i=0;i<datas.length;i++){
        if(datas[i].id===id){
            return datas[i];
        }
    }

    return undefined;
}

/**
 * 通过id获取楼层数据
 *
 * @param {Object[]} datas 建筑物数据
 * @param {string} id 楼层id
 * @return {undefined|Object}
 */
function getFloorData(datas,id,buildingId) {
    var building=getBuildingData(datas,buildingId);
    if(Cesium.defined(building)){
        for(var j=0;j<building.floors.length;j++){
            if(building.floors[j].id===id){
                return building.floors[j];
            }
        }
    }
    for(var i=0;i<datas.length;i++){
        building=datas[i];
        for(var j=0;j<building.floors.length;j++){
            if(building.floors[j].id===id){
                return building.floors[j];
            }
        }
    }

    return undefined;
}

/**
 * 通过id获取房屋数据
 *
 * @param {Object[]} datas 建筑物数据
 * @param {string} id 房屋id
 * @return {undefined|Object}
 */
function getHouseData(datas,id,floorId,buildingId) {
    var floor=getFloorData(datas,floorId,buildingId);
    if(Cesium.defined(floor)){
        for(var k=0;k<floor.houses.length;k++){
            if(floor.houses[k].id===id){
                return floor.houses[k];
            }
        }
    }
    var building=getBuildingData(datas,buildingId);
    if(Cesium.defined(building)){
        for(var j=0;j<building.floors.length;j++){
            floor=building.floors[j];
            for(var k=0;k<floor.houses.length;k++){
                if(floor.houses[k].id===id){
                    return floor.houses[k];
                }
            }
        }
    }
    for(var i=0;i<datas.length;i++){
        building=datas[i];
        for(var j=0;j<building.floors.length;j++){
            floor=building.floors[j];
            for(var k=0;k<floor.houses.length;k++){
                if(floor.houses[k].id===id){
                    return floor.houses[k];
                }
            }
        }
    }

    return undefined;
}

/**
 * 根据id获取数据
 * @param id
 * @return {undefined|{boundary, floors, name, description, id}|*|*}
 */
function getDataById(buildings,id) {
    for(var i=0;i<buildings.length;i++){
        var building=buildings[i];
        if(building.id===id){
            return  building;
        }
        for(var j=0;j<building.floors.length;j++){
            var floor=building.floors[j];
            if(floor.id===id){
                return floor;
            }
            for(var k=0;k<floor.houses.length;k++){
                var house=floor.houses[k];
                if(house.id===id){
                    return  house;
                }
            }
        }
    }

    return undefined;
}

/**
 * 创建楼栋
 *
 * @param {Object} buildingData 楼栋对象
 * @param {Cesium.PrimitiveCollection} primitives 承载楼栋的集合
 */
function createBuilding(buildingData,primitives) {
    var instance=new Cesium.GeometryInstance({
        geometry : new Cesium.PolygonGeometry({
            polygonHierarchy : new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArrayHeights(buildingData.boundary)
            )
        }),
        id : buildingData.id,
        attributes : {
            color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(buildingData.color))
        }
    });
    var buildingPrimitive=new Cesium.GroundPrimitive({
        geometryInstances : instance,
        asynchronous:true,
        classificationType : Cesium.ClassificationType.CESIUM_3D_TILE
    });

    primitives.add(buildingPrimitive);

    return buildingPrimitive;
}

/**
 * 创建多个楼栋
 *
 * @param {Object[]} buildingDatas 楼栋对象数组
 * @param {Cesium.PrimitiveCollection} primitives 承载楼栋的集合
 */
function createBuildings(buildingDatas,primitives) {
    var instances=[];

    for(var i=0;i<buildingDatas.length;i++){
        var buildingData=buildingDatas[i];
        var instance=new Cesium.GeometryInstance({
            geometry : new Cesium.PolygonGeometry({
                polygonHierarchy : new Cesium.PolygonHierarchy(
                    Cesium.Cartesian3.fromDegreesArrayHeights(buildingData.boundary)
                )
            }),
            id : buildingData.id,
            attributes : {
                color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(buildingData.color))
            }
        });

        instances.push(instance);
    }

    var buildingPrimitive=new Cesium.GroundPrimitive({
        geometryInstances : instances,
        asynchronous:true,
        classificationType : Cesium.ClassificationType.CESIUM_3D_TILE
    });

    primitives.add(buildingPrimitive);
}

/**
 * 创建楼层
 *
 * @param {Object} floorData 楼层对象
 * @param {Cesium.PrimitiveCollection} primitives 承载楼层的集合
 */
function createFloor(floorData,primitives) {
    var instance=new Cesium.GeometryInstance({
        geometry : new Cesium.PolygonGeometry({
            polygonHierarchy : new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArrayHeights(floorData.boundary)
            ),
            height:Number(floorData.altitude),
            extrudedHeight:Number(floorData.altitude)+Number(floorData.height)
        }),
        id : floorData.id,
        attributes : {
            color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(floorData.color))
        }
    });
    var floorPrimitive=new Cesium.ClassificationPrimitive({
        geometryInstances : instance,
        asynchronous:false,
        classificationType : Cesium.ClassificationType.CESIUM_3D_TILE
    });

    primitives.add(floorPrimitive);

    return floorPrimitive;
}

/**
 * 创建多个楼层
 *
 * @param {Object[]} floorDatas 楼层对象数组
 * @param {Cesium.PrimitiveCollection} primitives 承载楼层的集合
 */
function createFloors(floorDatas,primitives) {
    var instances=[];

    for(var i=0;i<floorDatas.length;i++){
        var floorData=floorDatas[i];
        var instance=new Cesium.GeometryInstance({
            geometry : new Cesium.PolygonGeometry({
                polygonHierarchy : new Cesium.PolygonHierarchy(
                    Cesium.Cartesian3.fromDegreesArrayHeights(floorData.boundary)
                ),
                height:Number(floorData.altitude),
                extrudedHeight:Number(floorData.altitude)+Number(floorData.height)
            }),
            id : floorData.id,
            attributes : {
                color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(floorData.color))
            }
        });


        instances.push(instance);
    }

    var floorPrimitive=new Cesium.ClassificationPrimitive({
        geometryInstances : instances,
        asynchronous:false,
        releaseGeometryInstances:false,
        classificationType : Cesium.ClassificationType.CESIUM_3D_TILE
    });

    primitives.add(floorPrimitive);
}

/**
 * 创建房屋
 *
 * @param {Object} houseData 房屋对象
 * @param {Cesium.PrimitiveCollection} primitives 承载房屋的集合
 *
 */
function createHouse(houseData,primitives) {
    var nPositions=[];

    var offset=JSON.parse(houseData.offset);

    var x = offset[0];
    var y = offset[1];
    var z = offset[2];
    x = Number(x);
    y = Number(y);
    z = Number(z);
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
        return;
    }

    var positions=Cesium.Cartesian3.fromDegreesArrayHeights(houseData.boundary);
    for (var i = 0; i < positions.length; i++) {
        var p=positions[i].clone();

        var transform = Cesium.Transforms.eastNorthUpToFixedFrame(p);
        var m=Cesium.Matrix4.multiplyByTranslation(transform, new Cesium.Cartesian3(x, y, z), new Cesium.Matrix4());
        var p1 = Cesium.Matrix4.getTranslation(m,new Cesium.Cartesian3());

        nPositions.push(p1);
    }

    var instance=new Cesium.GeometryInstance({
        geometry : new Cesium.PolygonGeometry({
            polygonHierarchy : new Cesium.PolygonHierarchy(nPositions),
            vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            height:Number(houseData.altitude),
            extrudedHeight:Number(houseData.altitude)+Number(houseData.height)
        }),
        id : houseData.id,
        attributes : {
            color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(houseData.color))
        }
    });


    /*var houseModelMatrix=instance.modelMatrix;
    Cesium.Matrix4.multiplyByTranslation(houseModelMatrix, new Cesium.Cartesian3(offset[0], offset[1], offset[2]), houseModelMatrix);
    instance.modelMatrix = houseModelMatrix;*/


    var housePrimitive=new Cesium.Primitive({
        geometryInstances : instance,
        asynchronous:false,
        appearance : new Cesium.PerInstanceColorAppearance({
            translucent:false,
            closed:true,
            renderState : {
                lineWidth : Math.min(2.0, scene.maximumAliasedLineWidth)
            }
        })
    });

    primitives.add(housePrimitive);

    return housePrimitive;
}

/**
 * 创建多个房屋
 *
 * @param {Object[]} houseDatas 房屋对象数组
 * @param {Cesium.PrimitiveCollection} primitives 承载房屋的集合
 */
function createHouses(houseDatas,primitives) {
    for(var i=0;i<houseDatas.length;i++) {
        var houseData = houseDatas[i];
        createHouse(houseData,primitives);
    }
}

/**
 * 创建多个房屋
 *
 * @param {Object[]} houseDatas 房屋对象数组
 * @param {Cesium.PrimitiveCollection} primitives 承载房屋的集合
 */
function createHouses_b(houseDatas,primitives) {
    var instances=[];

    for(var i=0;i<houseDatas.length;i++){
        var houseData=houseDatas[i];
        var offset=JSON.parse(houseData.offset);
        var instance=new Cesium.GeometryInstance({
            geometry : new Cesium.PolygonGeometry({
                polygonHierarchy : new Cesium.PolygonHierarchy(
                    Cesium.Cartesian3.fromDegreesArrayHeights(houseData.boundary)
                ),
                vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                height:Number(houseData.altitude),
                extrudedHeight:Number(houseData.altitude)+Number(houseData.height)
            }),
            id : houseData.id,
            attributes : {
                color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(houseData.color))
            }
        });

        var houseModelMatrix=instance.modelMatrix;
        Cesium.Matrix4.multiplyByTranslation(houseModelMatrix, new Cesium.Cartesian3(offset[0], offset[1], offset[2]), houseModelMatrix);
        instance.modelMatrix = houseModelMatrix;

        instances.push(instance);
    }

    var housePrimitive=new Cesium.Primitive({
        geometryInstances : instance,
        asynchronous:true,
        appearance : new Cesium.PerInstanceColorAppearance({
            translucent:false,
            closed:true,
            renderState : {
                lineWidth : Math.min(2.0, scene.maximumAliasedLineWidth)
            }
        })
    });

    primitives.add(housePrimitive);
}

/**
 * 创建房屋标注
 *
 * @param {Object} houseData 房屋对象
 * @param {Cesium.LabelCollection} labels 承载房屋标注的集合
 */
function createHouseLabels(houseDatas,labels) {
    for(var i=0;i<houseDatas.length;i++) {
        var houseData = houseDatas[i];

        var position=getCenterOfGravityPoint(houseData.boundary);
        var offset=JSON.parse(houseData.offset);

        var height=Number(houseData.altitude)+Number(houseData.height)+0.1;

        var p=Cesium.Cartesian3.fromDegrees(position[0],position[1],height);

        var transform = Cesium.Transforms.eastNorthUpToFixedFrame(p);
        var m=Cesium.Matrix4.multiplyByTranslation(transform, new Cesium.Cartesian3(offset[0], offset[1], offset[2]), new Cesium.Matrix4());
        var p1 = Cesium.Matrix4.getTranslation(m,new Cesium.Cartesian3());

        var label=labels.add({
            position : p1,
            text :houseData.name+'测试',
            font:'14px sans-serif',
            showBackground:true,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM
        });
    }
}