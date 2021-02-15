var $ = window.$,
    yaju1919 = window.yaju1919,
    LZString = window.LZString;
var dict = {};
[
    "standard",
    "elementarySchool",
    "juniorHighSchool",
    "otherKanji",
    "greek",
    "tenji",
].forEach(url=>$.get(`dict/${url}.txt`,r=>r.split('\n').filter(v=>v).forEach(v=>{
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
        "ヤツメ穴": "yatsume",
        "クロマグロがとんでくる": "maguro",
        "イワシはつちからはえてくるんだ": "184",
        "イワシはつちからはえてくるんだ（裏歌詞）": "184-ura",
        "ウミガメのなみだはしおらしい": "umigame",
        "ワニたちのなみだはうそらしい": "wani",
        "!": "kyozo-1",
        "i": "kyozo-i",
        "䊼髥莏": "kyozo-j",
        "_": "syachi",
        "螟冗ｶｾ逶ｮ": "cecilia",
        "ヤマイダレ": "yamaidare",
        "XXさないでください": "XX",
        "ケツとオチンポがかゆいのです": "kayui",
        "初音ミクの消失": "shoshitsu",
        "PARTY☆NIGHT": "partyNight",
    },
    change: function(v){
        if(!v) return;
        $.get(`sample/${v}.txt`, function(r){
            $("#input_str").val(r).trigger("change");
        });
    }
});
var h_youtube = $("<div>").appendTo(h);
var prevYouTube;
function testYouTube(url){
    var w = $(window).width() * 0.9;
    var m,Domain = yaju1919.getDomain(url);
    var query = url.split('?')[1] || '';
    switch(Domain.slice(-2).join('.')){
        case "youtu.be":
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
                height: w * (9/16)
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
        if(bgm) testYouTube(bgm.slice(4));
    },
});
$("<pre>").appendTo(h).text(`▼歌詞と同じ行では使えないコマンド

bgm@[YouTubeのURL] ... BGMを[YouTubeのURL]に設定する。1つしか適用されない。
c@[ミリ秒] ... 文字間の遅延時間を[ミリ秒]に設定する。
n@[ミリ秒] ... 改行間の遅延時間を[ミリ秒]に設定する。
[n]& ... [n]重唱 ( 1 < n < 7 )
c-en@[ミリ秒] ... Alphabetの文字間の遅延時間を[ミリ秒]に設定する。
c-num@[ミリ秒] ... 数字の文字間の遅延時間を[ミリ秒]に設定する。
ruby@[ 1 or 0 ] ... 1(true)だと、ルビを示す()内では遅延時間を0にする。
split@ ... 現在の位置でイベントを分割する

#EPOINT ... RPGENの命令を挿入する
#END ... #EPOINTの終端



▼歌詞と同じ行で使えるコマンド

[秒]@ ... [秒]の位置に動画をシークする
[ミリ秒]$ ... [ミリ秒]文字送りを止める
# ... 1文字分何もしない
\\[文字] ... 文字をエスケープする`);
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
function addWait(n){
    g_mapText += n === 0 || (g_ruby && g_rubying) ? '' : `
#WAIT
t:${Math.floor(n)},
#ED`;
}
var g_mapText, g_mapTexts, g_nowX, g_nowY,
    g_wait_c, g_wait_n,
    g_wait_c_en, g_wait_c_num,
    g_ruby, g_rubying,
    g_lines, g_linesY, g_line,
    g_floor_ar,
    g_epoints;
const startX = 33,
      startY = 33;
let reStartX,
    reStartY;
function init(){
    g_floor_ar = []
    g_mapText = '';
    g_nowX = startX;
    g_nowY = startY;
    g_wait_c = g_wait_n = g_wait_c_en = g_wait_c_num = 0;
    g_ruby = g_rubying = false;
    h_output.empty();
    g_mapTexts = [];
    reStartX = g_nowX;
    reStartY = g_nowY;
    g_epoints = [];
}
function main(){
    init();
    var str = input_str(),
        dict_keys = Object.keys(dict);
    if(judge(str.split('\n').filter(v=>!/^[a-zA-Z\-]+@/.test(v)).join('\n')
             .replace(/[\n\r\s　#]|[0-9]+[@\$&]/g,'')
             .replace(/#EPOINT(.|\n)*?#END/g,'')
             ,dict_keys)) return;
    g_lines = str.split("\n");
    for(g_linesY = 0; g_linesY < g_lines.length; g_linesY++){
        g_line = g_lines[g_linesY];
        if(cmdEpoint()) continue;
        else if(cmdDuet()) continue;
        else if(analysisCmd()) continue;
        else if(main2()) {
            g_nowY++;
            continue;
        }
        addWait(g_wait_n);
        g_nowY++;
        g_nowX = startX;
    }
    outputBookmarklet();
}
function main2(){
    var rows = g_line.replace(/^[0-9]+\$/,function(v){
        var n = Number(v.slice(0,-1));
        if(!isNaN(n)) addWait(n);
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
    if(!rows.length) return true;
    for(let rowX = 0; rowX < rows.length; rowX++) {
        var row = rows[rowX], escapeFlag = false;
        if(row === '(') g_rubying = true;
        if(row === ')') g_rubying = false;
        if(row === '#'){
            addWait(g_wait_c);
            continue;
        }
        if(row === '\\'){
            escapeFlag = true;
            row = rows[rowX+1];
            rowX++;
        }
        var id = dict[row];
        if(rowX && sute_gana.indexOf(row) === -1 && id){
            if(g_wait_c_en && /[a-zA-Z]/.test(row)){
                addWait(g_wait_c_en);
            }
            else if(g_wait_c_num && /[0-9]/.test(row)){
                addWait(g_wait_c_num);
            }
            else addWait(g_wait_c);
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
    return false;
}
function judge(str,dict_keys){
    var ar = [];
    str.split('').forEach(v=>{
        if(dict_keys.indexOf(v) === -1 && ar.indexOf(v) === -1) ar.push(v);
    });
    if(ar.length) {
        addErrorMsg("使えない文字があります。");
        yaju1919.addInputText(h_output,{
            title: "使えない文字",
            value: '["' + ar.join('","') + '"]',
            readonly: true
        });
    }
    return ar.length;
}
function analysisCmd(){
    if(!/^[^0-9\\]+@/.test(g_line)) return false;
    var ar = g_line.split('@'),
        n = Number(ar[1]);
    switch(ar[0]){
        case 'bgm':
            break;
        case 'c':
            g_wait_c = n;
            break;
        case 'n':
            g_wait_n = n;
            break;
        case 'c-en':
            g_wait_c_en = n;
            break;
        case 'c-num':
            g_wait_c_num = n;
            break;
        case 'ruby':
            g_ruby = n !== 0;
            break;
        case 'split':
            g_mapTexts.push([
                [reStartX, reStartY],
                g_mapText
            ]);
            reStartX = g_nowX;
            reStartY = g_nowY;
            g_mapText = '';
            break;
        default:
            addErrorMsg("該当のコマンドは存在しません。");
            addErrorMsg("普通の文字として扱うなら前に\\を追加してエスケープしてください。");
            addErrorMsg(g_line);
            break;
    }
    return true;
}
function cmdDuet(){
    if(!/[0-9]+&/.test(g_line)) return false;
    var n = Number(g_line.match(/[0-9]+/)[0]);
    if(n < 2 || n > 6) {
        addErrorMsg("[n]重奏コマンドの[n]は2~6の範囲で指定してください。");
        addErrorMsg(g_line);
        return true;
    }
    var ar = yaju1919.makeArray(n).map(i=>g_lines[g_linesY+i+1]);
    var max = yaju1919.max(ar.map(v=>v.length));
    yaju1919.makeArray(max).map(i=>yaju1919.makeArray(n).map(v=>ar[v][i])).forEach((v,x)=>{
        if(x) addWait(g_wait_c);
        g_mapText += `
#MV_PA
tx:${g_nowX+x},ty:${g_nowY},t:0,n:1,s:1,
#ED`;
        v.forEach((c,y)=>{
            if(!c) return;
            var id = dict[c];
            if(!id) return;
            g_mapText += `
#CH_SP
n:${id},tx:${g_nowX+x},ty:${g_nowY+y},l:0,
#ED`;
            if(g_floor_ar.indexOf(id) === -1) g_floor_ar.push(id);
        });
    });
    addWait(g_wait_n);
    g_linesY += n;
    g_nowY += n;
    g_nowX = startX;
    return true;
}
function cmdEpoint(){
    if(!/^#EPOINT/.test(g_line)) return false;
    const outSideFlag = /^#EPOINT tx:[0-9]+,ty:[0-9]+,/.test(g_line);
    let y;
    for(y = g_linesY; y < g_lines.length; y++){
        if("#END" === g_lines[g_linesY]) break;
    }
    if(y === g_lines.length) {
        addErrorMsg(g_linesY + "行目の#EPOINTに対する#ENDがありません");
        return true;
    }
    if(outSideFlag) g_epoints.push(g_lines.slice(g_linesY, y - 1).join('\n'));
    else g_mapText += g_lines.slice(g_linesY + 1, y - 1).join('\n');
    g_linesY = y;
    return true;
}
//----------------------------------------------------------------------
function outputBookmarklet(){
    var ar = [];
    ar.push("#HERO\n0,15");
    ar.push("#BGM\n");
    ar.push("#BGIMG\nhttps://i.imgur.com/TCdBukE.png");
    g_mapTexts.push([
        [reStartX, reStartY],
        g_mapText
    ]);
    let floor = (g_floor_ar.join(' ') + '\n'.repeat(15) + "45C\n" +　'\n'.repeat(g_nowY - startY + 62) + "45").split('\n');
    g_mapTexts.forEach(v=>{
        const xy = v[0],
              x = xy[0],
              y = xy[1];
        let line = floor[y].split(' ');
        if(line.length < x) line = line.concat(new Array(x - line.length).fill(' '));
        line[x] = "45C";
    });
    ar.push("#FLOOR\n" + floor.join('\n'));
    for(let i = 0; i < 20; i++){
        var scale = (i + 1) * 5 - 1;
        var y = startY + scale;
        if(y > g_nowY) break;
        ar.push(`#SPOINT
${startX},${y},0,${scale + 1}`);
    }
    g_epoints.forEach(v=>ar.push(v + '\n'));
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
    g_mapTexts.forEach(v=>{
        const xy = v[0];
        ar.push(`
#EPOINT tx:${xy[0]},ty:${xy[1]},
#PH0 tm:1,
${v[1]}
#PHEND0
`);
    });
    yaju1919.addInputText(h_output,{
        value: window.Bookmarklet.writeMapData(ar.map(v=>v+"#END").join('\n\n'))[1],
        textarea: true,
        readonly: true
    });
}
$("<h1>",{text:"スプライトセットメーカー"}).appendTo(h);
$("<div>",{text:"入力された文字列をスプライトセット化"}).appendTo(h);
var input_str2 = yaju1919.addInputText(h,{
    textarea: true,
    title: "文字列入力欄",
    save: "input_str2",
});
$("<button>").appendTo(h).text("スプライトセット作成").on("click",main3).css({
    color:"yellow",
    backgroundColor:"blue",
    fontSize: "2em",
});
function main3(){
    init();
    var str = input_str2(),
        dict_keys = Object.keys(dict);
    var reg = /[\n\r\s　]/g;
    if(judge(str.replace(reg,''),dict_keys)) return;
    var result = str.split('\n').map(function(line){
        return line.split('').map(function(c){
            return reg.test(c) ? '45' : dict[c];
        }).join(' ');
    }).join('\n');
    yaju1919.addInputText(h_output,{
        value: result,
        textarea: true,
        readonly: true
    });
}
