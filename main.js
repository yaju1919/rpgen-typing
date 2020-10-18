var $ = window.$,
    yaju1919 = window.yaju1919,
    LZString = window.LZString;
var dict = {};
[
    "standard.txt",
    "elementarySchool.txt",
].forEach(url=>$.get("dict/"+url,r=>r.split('\n').filter(v=>v).forEach(v=>{
    var ar = v.split(' ');
    if(ar.length !== 2) {
        return console.error(`Error at ${url}
${v}`);
    }
    dict[ar[1]] = ar[0];
})));
var h = $("<div>").appendTo($("body")).css({
    "text-align": "center",
    padding: "1em"
});
$("<h1>",{text:"RPGENのタイピングマップメーカー"}).appendTo(h);
$("<div>",{text:"歌詞などをタイピングマップ化"}).appendTo(h);
yaju1919.addSelect(h,{
    title: "サンプル歌詞",
    list: {
        "ここから選択してね": "",
        "クロマグロがとんでくる": "maguro",
        "イワシはつちからはえてくるんだ": "184",
        "イワシはつちからはえてくるんだ（裏歌詞）": "184-ura",
        "ウミガメのなみだはしおらしい": "umigame",
        "ケツとオチンポがかゆいのです": "kayui",
    },
    change: function(v){
        if(!v) return;
        $.get(`sample/${v}.txt`, function(r){
            $("#input_str").val(r).trigger("change");
        });
    }
});
var input_youtube = yaju1919.addInputText(h,{
    title: "YouTubeのテスト再生",
    change: testYouTube,
    id: "input_youtube",
});
var h_youtube = $("<div>").appendTo(h);
var prevYouTube;
testYouTube();
function testYouTube(){
    if(!input_youtube) return;
    var w = $(window).width() * 0.9;
    var url = input_youtube();
    var m,Domain = yaju1919.getDomain(url);
    var query = url.split('?')[1] || '';
    switch(Domain.slice(-2).join('.')){
        case "youtu.be": // YouTube
            m = url.match(/youtu\.be\/([A-Za-z0-9_\-]+)/);
        case "youtube.com":
            if(!m) m = url.match(/[\?&]v=([A-Za-z0-9_\-]+)/);
            if(!m) break;
            if(prevYouTube === m[1]) return;
            prevYouTube = m[1];
            $("<iframe>").appendTo(h_youtube.empty()).attr({
                src: "//www.youtube.com/embed/" + m[1]
            }).css({
                width: w,
                height: w * (9/16) // 16:9
            });
            break;
    }
    if(!m) $("<div>").appendTo(h_youtube.empty()).text("YouTubeの動画URLを入力してください。");
}
var input_str = yaju1919.addInputText(h,{
    textarea: true,
    title: "歌詞入力欄",
    save: "input_str",
    id: "input_str",
    change: function(v){
        var bgm = v.split('\n').filter(v=>/^[a-zA-Z]+@/.test(v)).filter(v=>/^bgm@/.test(v))[0];
        if(bgm) $("#input_youtube").val(bgm.slice(4)).trigger("change");
    },
});
$("<pre>").appendTo(h).text(`▼歌詞と同じ行では使えないコマンド

bgm@[YouTubeのURL] ... BGMを[YouTubeのURL]に設定する。1つしか適用されない。
c@[ミリ秒] ... 文字間の待機時間を[ミリ秒]に設定する。
n@[ミリ秒] ... 改行間の待機時間を[ミリ秒]に設定する。
[n]& ... [n]重唱



▼歌詞と同じ行で使えるコマンド

[秒]@ ... [秒]の位置に動画をシークする
[ミリ秒]$ ... [ミリ秒]文字送りを止める
# ... 1文字分何もしない`);
$("<button>").appendTo(h).text("マップ作成").on("click",main).css({
    color:"yellow",
    backgroundColor:"red",
    fontSize: "2em",
});
var h_output = $("<div>").appendTo(h);
function addErrorMsg(str){
    $("<div>").appendTo(h_output).text(str).css({
        color: "red",
        backgroundColor: "pink"
    });
}
var sute_gana = "ぁぃぅぇぉゕゖっゃゅょゎァィゥェォヵヶッャュョヮ";
function addWait(s){
    return Number(s) === 0 ? '' : `
#WAIT
t:${s},
#ED`;
}
var g_mapText, g_nowX, g_nowY,
    g_wait_c, g_wait_n,
    g_lines, g_linesY, g_line;
const startX = 33,
      startY = 33;
function init(){
    g_mapText = '';
    g_nowX = startX;
    g_nowY = startY;
    g_wait_c = g_wait_n = 0;
    h_output.empty();
}
function main(){
    init();
    var str = input_str(),
        dict_keys = Object.keys(dict);
    if(judge(str,dict_keys)) return;
    g_lines = str.split("\n");
    for(g_linesY = 0; g_linesY < g_lines.length; g_linesY++){
        g_line = g_lines[g_linesY];
        if(g_line === '') {
            g_nowY++;
            continue;
        }
        if(analysisCmd(g_line)) continue;
        main2();
        g_mapText += addWait(g_wait_n);
        g_nowY++;
        g_nowX = startX;
    }
    outputBookmarklet();
}
function main2(){
    var rows = g_line.replace(/^[0-9]+\$/,function(v){
        var n = Number(v.slice(0,-1));
        if(!isNaN(n)) g_mapText += addWait(n);
        return '';
    }).replace(/^[0-9]+@/,function(v){
        var n = Number(v.slice(0,-1));
        if(isNaN(n)) return '';
        g_mapText += `
#SK_YB
s:${n},
#ED`;
        return '';
    }).split('');
    for(let rowX = 0; rowX < rows.length; rowX++) {
        var row = rows[rowX], escapeFlag = false;
        if(row === '\\'){
            escapeFlag = true;
            row = rows[rowX+1];
            rowX++;
        }
        if(row === '#'){
            g_mapText += addWait(g_wait_c);
            continue;
        }
        var id = dict[row];
        if(rowX && sute_gana.indexOf(row) === -1 && id){
            g_mapText += addWait(g_wait_c);
        }
        if(!id) {
            g_nowX++;
            continue;
        }
        g_mapText += `
#MV_PA
tx:${g_nowX},ty:${g_nowY},t:0,n:1,s:1,
#ED
#CH_SP
n:${id},tx:${g_nowX},ty:${g_nowY},l:0,
#ED`;
        g_nowX++;
        if(g_floor_ar.indexOf(id) === -1) g_floor_ar.push(id);
    }
}
function judge(str,dict_keys){
    var s = "";
    str.split('\n').filter(v=>!/^[a-zA-Z]+@/.test(v)).join('\n')
        .replace(/[\n\r\s　#]|[0-9]+[@\$&]/g,'').split('').forEach(v=>{
        if(dict_keys.indexOf(v) === -1) s += v;
    });
    if(s) {
        addErrorMsg("使えない文字があります。");
        yaju1919.addInputText(h_output,{
            title: "使えない文字",
            value: s,
            readonly: true
        });
    }
    return s;
}
function analysisCmd(line){ // コマンド
    if(!/^[^0-9\\]+@/.test(line)) return false;
    var ar = line.split('@');
    switch(ar[0]){
        case 'bgm':
            break;
        case 'c':
            g_wait_c = ar[1];
            break;
        case 'n':
            g_wait_n = ar[1];
            break;
        default:
            addErrorMsg("該当のコマンドは存在しません。");
            addErrorMsg("普通の文字として扱うなら前に\\を追加してエスケープしてください。");
            addErrorMsg(line);
            break;
    }
    return true;
}
//----------------------------------------------------------------------
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
var g_floor_ar = [];
function outputBookmarklet(){
    var ar = [];
    ar.push("#HERO\n0,15");
    ar.push("#BGM\n");
    ar.push("#BGIMG\nhttps://i.imgur.com/TCdBukE.png");
    ar.push("#FLOOR\n" + g_floor_ar.join(' ') + '\n'.repeat(15) + "45C\n" +　'\n'.repeat(g_nowY - startY + 62) + "45");
    for(let i = 0; i < 20; i++){
        var scale = (i + 1) * 5 - 1;
        var y = startY + scale;
        if(y > g_nowY) break;
        ar.push(`#SPOINT
${startX},${y},0,${scale + 1}`);
    }
    ar.push(`
#EPOINT tx:0,ty:15,
#PH0 tm:1,
#CH_HM
n:A1469,i:0,
#ED
#WAIT
t:500,
#ED
#MV_PA
tx:33,ty:33,t:0,n:1,s:1,
#ED
#CH_YB
v:${h_youtube.find("iframe").attr("src").match(/embed\/(.+)$/)[1]},
#ED
#WAIT
t:2000,
#ED
#PS_YB
#ED
#SK_YB
s:0,
#ED
#WAIT
t:500,
#ED
#RS_YB
#ED
#CH_PH
p:0,x:${startX},y:${startY},
#ED
#PHEND0
`);
    ar.push(`
#EPOINT tx:${startX},ty:${startY},
#PH0 tm:1,
${g_mapText}
#PHEND0
`);
    var file = LZString.compressToEncodedURIComponent(ar.map(v=>v+"#END").join('\n\n'));
    var str = 'avascript:(function(){var map="' + file + '";(' + toStr(write) + ')();})();';
    yaju1919.addInputText(h_output,{
        value: str,
        textarea: true,
        readonly: true
    });

}
