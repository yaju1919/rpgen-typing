var h = $("<div>").appendTo($("body")).css({
    "text-align": "center",
    padding: "1em"
});
$("<h1>",{text:"RPGENのタイピングマップメーカー"}).appendTo(h);
$("<div>",{text:"歌詞などをタイピングマップ化"}).appendTo(h);
var input_str = yaju1919.addInputText(h,{
    title: "入力欄",
    placeholder: "ひらがな、カタカナ、英語、数字、記号のみ使用可能"
});
var input_wait_c = yaju1919.addInputNumber(h,{
    title: "文字間wait時間[ms]",
    int: true,
    max: 1000,
    value: 100,
    min: 0,
    save: "input_wait_c"
});
var input_wait_n = yaju1919.addInputNumber(h,{
    title: "改行間wait時間[ms]",
    int: true,
    max: 5000,
    value: 500,
    min: 0,
    save: "input_wait_n"
});
$("<button>").appendTo(h).text("マップ作成").on("click",main);
var output = $("<div>").appendTo(h);
var sute_gana = "ぁぃぅぇぉゕゖっゃゅょゎァィゥェォヵヶッャュョヮ";
function main(){
    var str = input_str(),
        wait_c = input_wait_c(),
        wait_n = input_wait_n();
    var dic_keys = Object.keys(dic);
    if(judge(str,dic_keys)) return;
    var s = "",
        x = 33,
        y = 33;
    str.split("\n").forEach((line)=>{
        line.split('').map((v,i)=>{
            if(i && sute_gana.indexOf(v) !== -1){
            s += `
#WAIT
t:${wait_c},
#ED`;
        }
        s += `
#CH_SP
n:810,tx:${x},ty:${y},l:0,
#ED
#MV_PA
tx:${x},ty:${y},t:0,n:1,s:1,
#ED`;
            x++;
        });
        s += `
#WAIT
t:${wait_n},
#ED`;
        y++;
    });
}
function judge(str,dic_keys){
    var s = "";
    str.replace(/\n/g,'').split('').forEach(v=>{
        if(dic_keys.indexOf(v) === -1) s += v;
    });
    if(s) {
        yaju1919.addInputText(output.empty(),{
            title: "使えない文字",
            value: s,
            readonly: true
        });
    }
    return s;
}
function toStr(func){ // 関数を文字列化
    return String(func).replace(/\/\/.*\n/g,'');
}
function write(){
    $.post(dqSock.getRPGBase() + 'cons/writeMapText.php',{
        token: g_token,
        index: parseInt(dq.mapNum),
        mapText: (dq.bOpenScr ? '' : 'L1') + map,
    }).done(function(r){
        if ( r != 0 ) apprise("error");
    }).fail(function(){
        apprise("error");
    });
}
function outputBookmarklet(s){
    var result = rpgenMap + `

#EPOINT tx:33,ty:33,
#PH0 tm:1,
${s}
#PHEND0
#END`
    var file = LZString.compressToEncodedURIComponent(result);
        var str = 'avascript:(function(){var map="' + file + '";(' + toStr(write) + ')();})();';
        yaju1919.addInputText(output.empty(),{
            value: str,
            textarea: true,
            readonly: true
        });
}
