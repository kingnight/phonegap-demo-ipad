var MYAPP = {
    app:{},
    version: "V1.3.0",
    questAction: "/AssessmentSys/quest.action",
    postAction: "/AssessmentSys/iosSave.action",
    getCount: "/AssessmentSys/simpleQuest.action",
    debugPostAction: "/AssessmentSys/iosSave.php",
    ip: "172.31.6.52", /*172.31.6.52*/
    port: "80",
    debug: true, /*debug status*/
    item: "",
    map: "",
    qid: "",
    uid: "",
    wordsList: "",
    queData: {},
    uid_index: 0, /*use for left side user listview index*/
    uid_lastIndex: 0,
    uid_max: 0,
    submitQid: {},
    submitUid: {},
    online: false,
    dialogOPEN: false,
    netTimeout: 8000,
    qidIndex: 0,
    qidMax: 0,
    BtnBgColor: "#ffffff",
    BtnFocusColotr: "#f08130",
    guid: "",
    pageNo: 0,
    MultiObj: {},
    running: false,
    isSubmitDataing: false,
    status: 100   /*100-init,0-server error, 1-new test ok, 2-no new test,  3-time limit, 4- submit success 5-submit fail 6-click once 8-本此测评包含多个问卷，未结束*/
};
var MESG = {
    msg_succ: "连接服务器成功！",
    msg_fail: "连接服务器失败，请检查网络",
    msg_servererror: "服务器错误",
    msg_failretry: "连接服务器失败，正在重连...",
    msg_wificlose: "WIFI未开启,请检查网络",
    msg_wj_new: "检测到新问卷，下载中...",
    msg_wj_old: "没有检测到新问卷",
    msg_dlok: "问卷下载成功，正在解析...",
    msg_dlfail: "问卷下载失败！",
    msg_enter: "请点击按钮开始测评!",
    msg_timeLimit: "距离上次提交时间间隔过短,请勿重复提交!",
    msg_testFinish: "问卷测评结束！",
    msg_uploadFail: "数据上传到服务器失败！"
};

$(document).ready(function () {
    MYAPP.app = new kendo.mobile.Application(document.body, {
        /*platform: "ios",*/
        transition: "slide",
        statusBarStyle: "black-translucent"});
    if (MYAPP.debug) {
        getConfig();
        MYAPP.guid = GetUUID();
        $("#appGuid").html("GUID:" + MYAPP.guid);
    }
    $("#appinfo").html(MYAPP.version);
    $.ajaxSetup({cache: false});

    $(document.body).kendoTouch({
        enableSwipe: true,
        minXDelta: 20,
        swipe: function (e) {
            //console.log("swipe " + e.direction+MYAPP.pageNo);
            if (MYAPP.pageNo >= 3) return;

            if (e.direction == "left") {
                if (MYAPP.pageNo == 0) {
                    MYAPP.pageNo = 100;
                    gotoListPage();
                }
                else if (MYAPP.pageNo == 1) {
                    MYAPP.pageNo = 100;
                    gotoInfoPage();
                }
                else if (MYAPP.pageNo == 2) {
                    //console.log("MYAPP.pageNo test"+MYAPP.pageNo);
                    MYAPP.pageNo = 100;
                    infoStart();
                }
            }
        }
    });


});

document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("online", onOnline, false);
document.addEventListener("offline", onOffline, false);

function onDeviceReady() {
    getConfig();
    MYAPP.guid = GetUUID();
    $("#appGuid").html("GUID:" + MYAPP.guid);
    $("#appinfo").append(" Build " + device.cordova);
}

function onOnline() {
    //console.log("online");
    MYAPP.online = true;
}

function onOffline() {
    //console.log("offline");
    MYAPP.online = false;
}

function saveQid(i) {
    localStorage.setItem("questionID", i);
}

function getQid() {
    return localStorage.getItem("questionID");
}

function clearQid() {
    localStorage.removeItem("questionID");
}

function updateListPageMsg(m) {
    $("#listpageShow").html(m);
}

function updateInfoPageMsg(m) {
    $("#infopageShow").html(m);
}

function updateLoginPageMsg(m) {
    $("#loginpageShow").html(m);
}

function json2str(json, info) {
    var json2str = JSON.stringify(json);
    console.log(info + "---" + json2str);
}

function SystemClear() {
    MYAPP.pageNo = 0;
    clearParaVal();
    reInitUIwidget();
}

function clearParaVal() {
//    MYAPP.item="";
//    MYAPP.map="";
//    MYAPP.qid="";
//    MYAPP.uid="";
    MYAPP.item = null;
    MYAPP.map = null;
    MYAPP.qid = null;
    MYAPP.uid = null;
    MYAPP.wordsList = "";
    MYAPP.uid_index = 0;
    MYAPP.uid_lastIndex = 0;
    MYAPP.uid_max = 0;
    MYAPP.submitQid = null;
    MYAPP.submitUid = null;
    MYAPP.dialogOPEN = false;
}

function reInitUIwidget() {
    //$("#queCount").empty();
    $("#listdetail").empty();
    $("#listpageShow").html("------");
    $("#listBtn").hide();

    $("#infodetail").empty();
    $("#submitBtn").hide();
    $("#infopageShow").html("------");
    $("#countdownNO").html("30");
}

function clearArea(ele) {
    //console.log("clearArea");
    var defaultVal = "请输入答案";
    var inputVal = ele.value;
    var res = inputVal.localeCompare(defaultVal);
    if (res == 0) ele.value = "";

}

//--------------list page--------------------------
function gotoListPage() {
    MYAPP.app.navigate("#listpage");
    //animate_navigate("#loginpage","#listpage");
    //listpageInit();
}

function listpageInit() {
    var url = getQuestionUrl();
    getQuestionCount(url, MYAPP.guid/*GetUUID()*/);
}

function getQuestionCount(url, uuid) {
    //1 check online
    if (!MYAPP.debug) {
        if (!MYAPP.online) {
            updateListPageMsg(MESG.msg_wificlose);
            return;
        }
    }
    //console.log("getQuestionCount:"+url+"  uuid:"+uuid);
    MYAPP.app.showLoading();
    $.ajax({
        type: "GET",
        url: url,
        data: {code: uuid},
        dataType: "json",
        timeout: MYAPP.netTimeout
    })
        .done(function (json) {
            if (parseInt(json.res) == 0) {
                updateListPageMsg("非法设备！");
                return;
            }
            else if (parseInt(json.res) == 13) {
                updateListPageMsg("在规定时间内，请勿重复提交数据！");
                return;
            }
            MYAPP.queData = json.data.questions;
            MYAPP.noticeContent = json.data.noticeContent;
            //json2str(MYAPP.queData,"MYAPP.queData");
            var len = MYAPP.queData.length;
            var content = "";
            //console.log("data length:"+ len);
            if (len == 0) {
                updateListPageMsg("无法获得测评数据，测评数据异常");
                //console.log("data len=0");
            }
            else {
                MYAPP.qidMax = len;
                //console.log("MYAPP.qidMax"+MYAPP.qidMax);
                MYAPP.qidIndex = 0;
                //var str="本次测评包含"+MYAPP.qidMax+"套问卷";
                //$("#queCount").html(str);
                var temBegin = "<div style=\"margin: 1em 1em;\"><img src=\"images/listicon.png\" style=\"vertical-align: middle;\"><span style=\"vertical-align: middle;height:54px;line-height:54px;margin-left: 1em;\">";
                var temEnd = "</span></div>";
                for (var i = 0; i < len; i++) {
                    //var index=i+1;
                    content += temBegin + MYAPP.queData[i].name + temEnd;
                }
                $("#listdetail").html(content);    //note
                $("#listdetail").kendoMobileScroller();
                $("#listBtn").show();
            }
            MYAPP.pageNo = 1;

        })
        .fail(function (xhr, textStatus) {
            if (MYAPP.debug)
                updateListPageMsg("无法获得测评数据！" + textStatus + " " + xhr.status);
            else
                updateListPageMsg("无法获得测评数据！");
            //$("#queCount").html("------");
            console.log("getQuestionCount fail");
        })
        .always(function () {
            MYAPP.app.hideLoading();
        });
}

function getQueDataId(i) {
    if (i < MYAPP.queData.length)
        return MYAPP.queData[i].id;
    else
        return "";
}

function getQueDataName(i) {
    if (i < MYAPP.queData.length)
        return MYAPP.queData[i].name;
    else
        return "";
}

//-------------list page over----------------------------

//-------------info page-------------
function infoInit() {
    //set detailinfo
    $("#infodetail").html(MYAPP.noticeContent);
    $("#infodetail").kendoMobileScroller();

    var max = 30;
    MYAPP.pageNo = 2;
    MYAPP.tick = setInterval(function () {
        max--;
        if (max <= 0) {
            clearInterval(MYAPP.tick);
            init();
        }
        else {
            $("#countdownNO").html(max);
        }
    }, 1000);
}

function infoStart() {
    clearInterval(MYAPP.tick);
    init();
}

function gotoInfoPage() {
    MYAPP.app.navigate("#infopage");
    //animate_navigate("#listpage","#infopage");
    //infoInit();
}
//----------------info over---------------------

//----------------eval page-----------------------------
function init() {
    //console.log("init");
    //MYAPP.status=100;
    clearParaVal();
    var idvalue = getQueDataId(MYAPP.qidIndex);
    //console.log("idvalue："+idvalue);
    //save index
    saveQid(idvalue);

    //console.log("MYAPP.qidIndex"+MYAPP.qidIndex+"  idvalue:"+idvalue);
    checkDataStatus(getQuestUrl(), MYAPP.guid/*GetUUID()*/, idvalue);
}

function analyseData(uid, qid, item, map, wordsList) {

    MYAPP.qid = renderTemplate("#qidTemplate", qid);
    //console.log(MYAPP.qid);
    if (uid.length == 0) {
        MYAPP.uid = renderTemplate("#uidTemplateDepart", qid);
        //console.log(MYAPP.uid);
    }
    else
        MYAPP.uid = renderTemplate("#uidTemplate", uid);

    if (item.length != 0)
        MYAPP.item = renderTemplate("#itemTemplate", item);
    /*else
     console.log("item.length==0");*/
    if (map.length != 0)
        MYAPP.map = renderTemplate("#mapTemplate", map);
    /*else
     console.log("map.length==0");*/
    if (wordsList.length != 0)
        MYAPP.wordsList = renderTemplate("#wordsTemplate", wordsList);  //////test
    /*else
     console.log("wordsList.length==0");*/
}

function renderTemplate(tempalteID, dataSource) {
    var templateContent = $(tempalteID).html();
    var template = kendo.template(templateContent);
    var result = template(dataSource, {useWithBlock: false});
    return result;
}

function GetUUID() {
    if (MYAPP.debug)
        return "59BED579-30F8-4A47-BACE-220E78923EE0";
    return device.uuid;
}

function checkDataStatus(url, uuid, qid) {
    MYAPP.app.showLoading();
    //console.log("url"+url+"---"+" uuid"+uuid+" qid"+qid);
    //save index
    /*var savedQid=getQid();
     if(savedQid && savedQid!==qid) {
     qid=savedQid;
     }*/

    $.ajax({
        type: "GET",
        url: url,
        data: {code: uuid, qid: qid},
        dataType: "json",
        timeout: MYAPP.netTimeout
    })
        .done(function (json) {
            //console.log("data.res",json.res);
            //console.log("data length:"+ json.data.item.length);
            MYAPP.pageNo = 3;
            var para = parseInt(json.res);
            var data = json.data;
            switch (para) {
                case 0:
                    openSubmitDailog(MESG.msg_servererror);
                    MYAPP.status = 0;
                    break;
                case 1:
                {
                    if (/*data.item.length==0 || data.map.length==0 |||| data.uid.length==0*/ data.qid.length == 0) {
                        openSubmitDailog("服务器下发数据格式异常!");
                        MYAPP.status = 0;
                        return;
                    }
                    MYAPP.uid_max = data.uid.length;
                    MYAPP.submitQid = data.qid;
                    MYAPP.submitUid = data.uid;
                    MYAPP.uid_index = 0;
                    MYAPP.uid_lastIndex = 0;
                    MYAPP.qid_type = data.qid.type;
                    //json2str(data.uid,"data.uid");
                    //json2str(data.qid,"data.qid");
                    analyseData(data.uid, data.qid, data.item, data.map, data.itemWordList);
                    //json2str(data.uid,"data.uid");
                    //json2str(data.itemWordList,"data.itemWordList");
                    //console.log("status:"+MYAPP.status);
                    if (MYAPP.status == 8) {
                        console.log("goto next");
                        evalInit();
                    }
                    else {
                        MYAPP.status = 1;
                        MYAPP.app.navigate("#evaluation");
                        //animate_navigate("#infopage","#evaluation");
//          setTimeout(function(){
//            //evalInit();
//            MYAPP.app.navigate("#evaluation");
//          },1500);

                    }
                    break;
                }
                case 2:
                    openSubmitDailog(MESG.msg_wj_old);
                    MYAPP.status = 2;
                    break;
                case 3:
                    openSubmitDailog(MESG.msg_timeLimit);
                    MYAPP.status = 3;
                    break;
            }

        })
        .fail(function (xhr, textStatus) {
            if (MYAPP.debug)
                openSubmitDailog(MESG.msg_fail + " " + textStatus + " " + xhr.status);
            else
                openSubmitDailog(MESG.msg_fail);
            MYAPP.status = 0;
            console.log("checkDataStatus fail");
        })
        .always(function () {
            MYAPP.app.hideLoading();
        });
}

function evalInit() {
    //console.log("evalInit");
    MYAPP.app.showLoading();

    MYAPP.status = 100;
    MYAPP.AllData = null;
    MYAPP.AllData = new Array();
    $("#submitBtn").hide();
    $("#headerBtn").hide();
    $("#uidListView").html(" ");
    $("#qidListView").html(" ");
    $("#itemListView").html(" ");

    setTimeout(function () {
        $("#uidListView").html(MYAPP.uid);
        UidListscroll2Top();

        uidListInitFocus();

        $("#qidListView").html(MYAPP.qid);

        if (MYAPP.item === null)
            MYAPP.item = "";
        if (MYAPP.map === null)
            MYAPP.map = "";
        if (MYAPP.wordsList === null)
            MYAPP.wordsList = "";
        $("#itemListView").html(MYAPP.item + MYAPP.map + MYAPP.wordsList);
        uidListInitFocus();

        $(".item>.km-list>li>.scorebtn").css("background-color", "#fff");

        $("#submitBtn").show();
        $("#headerBtn").show();
        scroll2Top();

        setTimeout(function () {
            MYAPP.app.hideLoading();
        }, 100);

        MultiCheckboxLimit();

    }, 500);

}

function MultiCheckboxLimit() {
    if ($(".jcheck").length > 0) {
        $(".jcheck").change(function () {
            if (this.checked) {
                //Do stuff
                var $root = $(this).parent().parent().parent();
                var max = parseInt($root.attr("cbl"));
                //console.log("max:"+max);
                var obj = $root.find("input[type=checkbox]");
                var total = 0;
                for (var i = 0; i < obj.length; i++) {
                    //console.log("index:"+i+obj.eq(i).prop("checked"));
                    if (obj.eq(i).prop("checked")) {
                        total = total + 1;
                        if (total > max) {
                            //obj.eq(i).removeAttr("checked");
                            $(this).removeAttr("checked");
                            openSubmitDailog("本题限选" + max + "项，请勿多选！");
                            return false;
                        }
                    }
                }

            }
        });
    }
}

function scroll2Top() {
    $("#testpage").find(".km-scroll-container").css("-webkit-transform", "");
}

function UidListscroll2Top() {
    $("#testobject").find(".km-scroll-container").css("-webkit-transform", "");
}

function checkDataFull() {
    for (var i = 0; i < MYAPP.uid_max; i++) {
        if (MYAPP.AllData[i] == null)
            return false;
    }
    return true;
}

function submitCurrentPage() {
    //console.log("submitCurrentPage");
    MYAPP.app.showLoading();

    setTimeout(function () {
        checkMultiChoice();
        MYAPP.singleUidFin = checkSinglePageComplete();
        if (MYAPP.singleUidFin) {
            actionSubmitSPD();
            MYAPP.app.hideLoading();
        }
        //single not complete
        else {
            MYAPP.app.hideLoading();
            openSingleDialog();
        }
    }, 500);
}

//check words list limit number whether or not over max
function checkMultiChoice() {
    var obj_words = $(".km-group-container.words");
    for (var i = 0; i < obj_words.length; i++) {
        var itype = parseInt(obj_words.eq(i).attr("itype"));
        var max = parseInt(obj_words.eq(i).attr("cbl"));
        var objdata = obj_words.eq(i).find("ul>li");
        //console.log("max:"+max);
        if (max == 0) continue;
        if (itype == 2 || itype == 4 || itype == 5) {   //multi OR multi+simple answer
            var count = 0;
            for (var j = 0; j < objdata.length; j++) {

                var check = objdata.eq(j).find("input[type=checkbox]").attr("checked");
                //console.log("itype"+itype+" "+check);
                if (check == "checked") {
                    count++;
                    if (count > max) {
                        for (var z = 0; z < max - count; z++) {
                            objdata.eq(j).find("input[type=checkbox]").removeAttr("checked");
                            console.log("do clean checkMultiChoice");
                        }

                    }
                }
            }
        }

    }

}

//real submit single data to memory
function actionSubmitSPD() {
    submitPageData();
    uidListViewFinished(MYAPP.uid_index);
    if (MYAPP.uid_index < MYAPP.uid_max - 1) {
        MYAPP.uid_index++;
        uidListViewSetFocus(MYAPP.uid_index, MYAPP.uid_index - 1);
        MYAPP.uid_lastIndex = MYAPP.uid_index;
        renderParticalPage();
        //scroll to top
        scroll2Top();
    }
}

function submitAllPage() {
    if (MYAPP.isSubmitDataing) return;
    MYAPP.isSubmitDataing = true;
    MYAPP.app.showLoading();

    setTimeout(function () {
        if (MYAPP.submitUid.length == 0) {
            submitAllData();
        }
        else {
            if (checkDataFull())
                submitAllData();
            else {
                openAllDialog();
                //MYAPP.dialogOPEN=false;
                MYAPP.app.hideLoading();
                MYAPP.isSubmitDataing = false;
            }
        }
    }, 500);

}

//left side user list click event handler
function uidClickItem(e) {
    if (MYAPP.submitUid.length == 0) return;

    var index = parseInt(e.item.attr("val"));

    if (MYAPP.uid_index == index) return;
    MYAPP.uid_index = index;
    uidListViewSetFocus(MYAPP.uid_index, MYAPP.uid_lastIndex);
    MYAPP.uid_lastIndex = MYAPP.uid_index;
    //setTimeout(function(){
    renderParticalPage();
    scroll2Top();
    renderDetail(MYAPP.uid_index);
    //},50);
}

function renderParticalPage() {
    $("#itemListView").html("");
    $("#itemListView").append(MYAPP.item + MYAPP.map + MYAPP.wordsList);
    $(".item>.km-list>li>.scorebtn").css("background-color", "#fff");
    MultiCheckboxLimit();
}

//render detail info in right side button
function renderDetail(index) {
    //console.log(index+"---"+MYAPP.AllData.length);
    if (index >= MYAPP.AllData.length) return;
    var objData = MYAPP.AllData[index];

    var itemObj = objData.item;
    var mapObj = objData.map;
    var wordsObj = objData.itemWordList;

    var item_len = itemObj.length;
    var map_len = mapObj.length;
    var words_len = wordsObj.length;

    //item render
    for (var j = 0; j < item_len; j++) {
        var id = itemObj[j].id;
        var value = parseInt(itemObj[j].value);
        //console.log("'#"+id+"'"+" "+value);
        var focusOBJ = $("#" + id).find(".scorebtn").eq(10 - value);
        focusOBJ.addClass("btnfocus");
        focusOBJ.css("background-color", MYAPP.BtnFocusColotr);
    }
    //map render
    for (var k = 0; k < map_len; k++) {
        var id = mapObj[k].id;
        var value = parseInt(mapObj[k].value);
        //console.log(id+" "+value);
        var mapIndex;
        if (value == 1) mapIndex = 0;
        else if (value == 2) mapIndex = 1;
        else if (value == 3) mapIndex = 2;
        else if (value == 4) mapIndex = 3;

        var focusOBJ = $("#" + id).find(".scorebtn").eq(mapIndex);
        focusOBJ.addClass("btnfocus");
        focusOBJ.css("background-color", MYAPP.BtnFocusColotr);
    }

    //words render
    for (var k = 0; k < words_len; k++) {
        var itype = parseInt(wordsObj[k].itype);
        if (itype == 1) {//single
            var array = wordsObj[k].value;
            $("#" + array[0]).attr("checked", "checked");
        }
        else if (itype == 2) {  //multi
            var array = wordsObj[k].value;
            for (l = 0; l < array.length; l++) {
                var id = array[l];
                $("#" + id).attr("checked", "checked");
            }
        }
        else if (itype == 3) {   //simple answer
            var queID = wordsObj[k].id;
            var content = wordsObj[k].content;
            $("#" + queID).find("textarea").html(content);
        }
        else if (itype == 4) {   //multi+simple answer
            var array = wordsObj[k].value;
            var id = "";
            for (l = 0; l < array.length; l++) {
                id = array[l];
                $("#" + id).attr("checked", "checked");
            }
            var content = wordsObj[k].content;
            var parUL = $("#" + id).parent().parent().parent().find("textarea").html(content);
        }
    }

}

//right side detail button click event handler
function listViewClick(e) {
    //console.log(e.target.html());
    if (e.target.hasClass("scorebtn")) {
        e.target.parent().find(".btnfocus").removeClass("btnfocus").css("background-color", MYAPP.BtnBgColor);
        e.target.addClass("btnfocus");
        e.target.css("background-color", MYAPP.BtnFocusColotr);
    }
}
//set left side listview li focus
function uidListViewSetFocus(newI, lastI) {
    var newIndex = parseInt(newI);
    var lastIndex = parseInt(lastI);

    $("#uidListView").find("li:eq(" + newIndex + ")").addClass("km-state-active");	//km-state-active
    $("#uidListView").find("li:eq(" + lastIndex + ")").removeClass("km-state-active");
}
//init set focus
function uidListInitFocus() {
    $("#uidListView").find("li:eq(0)").addClass("km-state-active");
}

//set left listview li status from × to √
function uidListViewFinished(t) {
    var index = parseInt(t);
    if (MYAPP.singleUidFin)
        $("#uidListView").find("li:eq(" + index + ")").find(".uidicon").removeClass("km-cancel").removeClass("km-unfinished").addClass("km-ok");
    else
        $("#uidListView").find("li:eq(" + index + ")").find(".uidicon").removeClass("km-cancel").addClass("km-unfinished");
}

//check single page complete?
function checkSinglePageComplete() {
    //console.log("checkSinglePageComplete");
    var obj_item = $(".km-group-container.item");
    var obj_map = $(".km-group-container.map");
    //check item
    for (var i = 0; i < obj_item.length; i++) {
        var objdata = obj_item.eq(i).find("li.btngroup>.btnfocus");
        if (objdata.length == 0) {
            return false;
        }
    }
    //check map
    for (var i = 0; i < obj_map.length; i++) {
        var objdata = obj_map.eq(i).find("li.btngroup>.btnfocus");
        if (objdata.length == 0) {
            return false;
        }
    }
    //check words list
    var obj_words = $(".km-group-container.words");
    for (var i = 0; i < obj_words.length; i++) {
        var result = false;
        var itype = parseInt(obj_words.eq(i).attr("itype"));
        //console.log(itype);
        var objdata = obj_words.eq(i).find("ul>li");
        if (itype == 1) {   //single
            for (var j = 0; j < objdata.length; j++) {
                var check = objdata.eq(j).find("input[type=radio]").attr("checked");
                //console.log("itype"+itype+" "+check);
                if (check == "checked") {
                    result = true;
                    break;
                }
            }
        }
        else if (itype == 2 || itype == 4 || itype == 5) {   //multi OR multi+simple answer
            for (var j = 0; j < objdata.length; j++) {
                var check = objdata.eq(j).find("input[type=checkbox]").attr("checked");
                //console.log("itype"+itype+" "+check);
                if (check == "checked") {
                    result = true;
                    break;
                }
            }
        }
        else if (itype == 3) {   //simple answer
            for (var j = 0; j < objdata.length; j++) {
                var check = objdata.eq(j).find("textarea").val();

                var defaultVal = "请输入答案";
                var res = check.localeCompare(defaultVal);
                if (res == 0)  check = "";

                //console.log("itype"+itype+" "+check);
                if (check != "") {
                    result = true;
                    break;
                }
            }
        }
        if (!result) return false;
    }
    return true;
}

//submit single page data
function submitPageData() {
    var obj_item = $(".km-group-container.item");
    var obj_map = $(".km-group-container.map");
    var obj_words = $(".km-group-container.words");

    var dataArray = new Array();
    var dataArray2 = new Array();
    var dataArray3 = new Array();

    for (var i = 0; i < obj_item.length; i++) {
        var objdata = obj_item.eq(i).find("li.btngroup>.btnfocus");
        var dataID, dataValue;
        dataID = obj_item.eq(i).find("li.btngroup").attr("id");
        if (objdata.length > 0) {
            dataValue = objdata.attr("value");
        }
        else
            dataValue = 0;
        dataArray[i] = {id: dataID, value: dataValue};
    }

    for (var i = 0; i < obj_map.length; i++) {
        var objdata = obj_map.eq(i).find("li.btngroup>.btnfocus");
        var dataID, dataValue;
        dataID = obj_map.eq(i).find("li.btngroup").attr("id");
        if (objdata.length > 0) {
            dataValue = objdata.attr("value");
        }
        else
            dataValue = 0;
        dataArray2[i] = {id: dataID, value: dataValue};
    }

    var subdataArray = new Array();

    for (var i = 0; i < obj_words.length; i++) {
        var FOBJ = obj_words.eq(i);
        var type = parseInt(FOBJ.attr("itype"));
        //console.log("type"+type);
        if (type == 1) {  //single
            var itemID = FOBJ.attr("id");
            var objdata = FOBJ.find("ul>li");
            //console.log("itemID:"+itemID);
            subdataArray = [];
            for (var j = 0; j < objdata.length; j++) {
                var subObjItem = objdata.eq(j).find("input[type=radio]");
                var check = subObjItem.attr("checked");
                if (check == "checked") {
                    var res = subObjItem.attr("id");
                    //console.log(res);
                    subdataArray.push(res);
                }

            }
            dataArray3[i] = {itype: type, id: itemID, value: subdataArray, content: ""};
        }
        else if (type == "2" || type == "5") {  //multi
            var itemID = FOBJ.attr("id");
            var objdata = FOBJ.find("ul>li");
            //console.log("itemID:"+itemID);
            subdataArray = [];
            for (var j = 0; j < objdata.length; j++) {
                var subObjItem = objdata.eq(j).find("input[type=checkbox]");
                var check = subObjItem.attr("checked");
                if (check == "checked") {
                    var res = subObjItem.attr("id");
                    //console.log(res);
                    subdataArray.push(res);
                }

            }
            dataArray3[i] = {itype: type, id: itemID, value: subdataArray, content: ""};
        }
        else if (type == "3") {  //simple answer only
            var itemID = FOBJ.attr("id");
            var answer = FOBJ.find("ul>li>label>textarea").val();

            var defaultVal = "请输入答案";
            var res = answer.localeCompare(defaultVal);
            if (res == 0) answer = "";

            //console.log("itemID:"+itemID+"answer:"+answer);
            dataArray3[i] = {itype: type, id: itemID, value: [], content: answer};
        }
        else if (type == "4") {  //multi+simple answer
            var content = "";
            var itemID = FOBJ.attr("id");
            var objdata = FOBJ.find("ul>li");
            //console.log("itemID:"+itemID);
            subdataArray = [];
            for (var j = 0; j < objdata.length; j++) {
                if (j != objdata.length - 1) {
                    var subObjItem = objdata.eq(j).find("input[type=checkbox]");
                    var check = subObjItem.attr("checked");
                    if (check == "checked") {
                        var res = subObjItem.attr("id");
                        //console.log(res);
                        subdataArray.push(res);
                    }
                }
                else {
                    content = objdata.eq(j).find("textarea").val();

                    var defaultVal = "请输入答案";
                    var res = content.localeCompare(defaultVal);
                    if (res == 0) content = "";
                }

            }
            dataArray3[i] = {itype: type, id: itemID, value: subdataArray, content: content};
        }

    }

    var uid = getUid();
    var SingleData = {uid: uid, item: dataArray, map: dataArray2, itemWordList: dataArray3};

    MYAPP.AllData[MYAPP.uid_index] = SingleData;
    if (MYAPP.debug)
        json2str(MYAPP.AllData, "PageNo" + MYAPP.uid_index);
}
//------------submit dialog------------------------------------
function openSubmitDailog(msg) {
//    if (MYAPP.dialogOPEN == false) {
//        MYAPP.dialogOPEN = true;
//        var modalView = $("#submitDialog").data("kendoMobileModalView");
//        modalView.open();
//        if (msg)
//            $("#subcontent").html(msg);
//    }
    navigator.notification.alert(msg, function(){
        closeSubmitDialog();
    }, "提示", "确定");
}

function closeSubmitDialog() {
    //setTimeout(function(){
//    var modalView = $("#submitDialog").data("kendoMobileModalView");
//    modalView.close();
//    MYAPP.dialogOPEN = false;
    if (MYAPP.status == 8) {
        init();
    }
    else if (MYAPP.status == 4) {
        MYAPP.app.navigate("#loginpage");
    }
    return false;
    //},100);

}

//config ip and port timeout dialog
function openConfigDialog() {
    if (MYAPP.dialogOPEN == false) {
        MYAPP.dialogOPEN = true;
        var modalView = $("#configDialog").data("kendoMobileModalView");
        modalView.open();

        //set data to UI
        transLocalData2UI();
    }
}

function closeConfigDialog() {
    var modalView = $("#configDialog").data("kendoMobileModalView");
    modalView.close();
    MYAPP.dialogOPEN = false;
}

//all single submit dialog--------------------
function openSingleDialog() {

    function onConfirm(buttonIndex) {
        //alert('You selected button ' + buttonIndex);
        if(buttonIndex==1){
            //SinglecancelDialog();
        }
        else
        {
            actionSubmitSPD();
        }
    }

    navigator.notification.confirm(
        '测评内容填写不完整,是否继续下一个?', // message
        onConfirm,            // callback to invoke with index of button pressed
        '提示',           // title
        ['取消','确定']         // buttonLabels
    );
}

//all page submit dialog--------------------
function openAllDialog() {

    function onConfirm(buttonIndex) {
        //alert('You selected button ' + buttonIndex);
        if(buttonIndex==1){

        }
        else
        {
            submitAllData();
        }
    }

    navigator.notification.confirm(
        '问卷信息未填写完整,是否继续提交？', // message
        onConfirm,            // callback to invoke with index of button pressed
        '提示',           // title
        ['取消','确定']         // buttonLabels
    );
}

function setConfig() {

    var ip = $("#ipStr")[0].value;
    var port = $("#port")[0].value;

    var timeout = $("#timeout")[0].value;

    var url = "http://" + ip + ":" + port;

    localStorage.setItem("ip", ip);
    localStorage.setItem("port", port);
    localStorage.setItem("timeout", timeout);
    MYAPP.ip = ip;
    MYAPP.port = port;
    MYAPP.netTimeout = timeout;
    closeConfigDialog();
}

function getConfig() {

    var ip = localStorage.getItem("ip");
    var port = localStorage.getItem("port");
    var timeout = localStorage.getItem("timeout");
    if (ip) MYAPP.ip = ip;
    if (port) MYAPP.port = port;
    if (timeout) MYAPP.netTimeout = timeout;
}

function getQuestUrl() {
    return "http://" + MYAPP.ip + ":" + MYAPP.port + MYAPP.questAction;
}

function getPostUrl() {
    if (MYAPP.debug)
        return "http://" + MYAPP.ip + ":" + MYAPP.port + MYAPP.debugPostAction;
    else
        return "http://" + MYAPP.ip + ":" + MYAPP.port + MYAPP.postAction;
}

function getQuestionUrl() {
    return "http://" + MYAPP.ip + ":" + MYAPP.port + MYAPP.getCount;
}

function transLocalData2UI() {
    $("#ipStr").attr("value", MYAPP.ip);
    $("#port").attr("value", MYAPP.port);
    $("#timeout").attr("value", MYAPP.timeout);
}

//submit all data to server
function submitAllData() {
    //console.log("submitAllData");
    //check online
    if (MYAPP.online || MYAPP.debug) {
        var qid = MYAPP.submitQid.id;
        var departcode = MYAPP.submitQid.departcode;
        var code = MYAPP.guid/*GetUUID()*/;
        var dataSend = {qid: qid, departcode: departcode, code: code, type: MYAPP.qid_type, group: MYAPP.AllData};

        if (MYAPP.debug)
            json2str(dataSend, "AllData");

        //send data to server
        sendData2Server(getPostUrl(), dataSend);
    }
    else {
        openSubmitDailog(MESG.msg_wificlose);
        MYAPP.isSubmitDataing = false;
    }

}

function getUid() {
    if (MYAPP.submitUid.length != 0)
        return MYAPP.submitUid[MYAPP.uid_index].id;
    else
        return "";
}

function sendData2Server(url, data) {
    var json2string = JSON.stringify(data);
    $.ajax({
        type: "POST",
        url: url, /*"http://192.168.17.44/php/t1.php"*/
        data: json2string,
        dataType: "json",
        timeout: MYAPP.netTimeout
    })
        .done(function (json) {
            //console.log("done");
            var str = "测评提交成功！";
            MYAPP.qidIndex++;
            //save index
            var idvalue = getQueDataId(MYAPP.qidIndex);
            saveQid(idvalue);
            //console.log("MYAPP.qid:"+MYAPP.qidIndex +" of "+MYAPP.qidMax);
            if (MYAPP.qidIndex < MYAPP.qidMax) {
                var strName = getQueDataName(MYAPP.qidIndex);
                var strEnter = "进入下一套：";
                MYAPP.status = 8;
                openSubmitDailog(str + strEnter + " " + strName);
            }
            else {
                MYAPP.status = 4;
                clearQid();
                openSubmitDailog(str);
            }
        })
        .fail(function (xhr, textStatus) {
            MYAPP.status = 5;
            if (MYAPP.debug)
                openSubmitDailog(MESG.msg_uploadFail + " " + textStatus + " " + xhr.status);
            else
                openSubmitDailog(MESG.msg_uploadFail);
        })
        .always(function () {
            MYAPP.app.hideLoading();
            MYAPP.isSubmitDataing = false;
        });
}