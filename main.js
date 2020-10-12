var $ = window.$,
    yaju1919 = window.yaju1919,
    dic = window.dic,
    LZString = window.LZString;
$.get("sample/184.txt",loaded);
function loaded(sampleText){
    var h = $("<div>").appendTo($("body")).css({
        "text-align": "center",
        padding: "1em"
    });
    $("<h1>",{text:"RPGENのタイピングマップメーカー"}).appendTo(h);
    $("<div>",{text:"歌詞などをタイピングマップ化"}).appendTo(h);
    var input_youtube = yaju1919.addInputText(h,{
        class: "input_youtube",
        title: "BGMに使うyoutubeのURLを入力",
        save: "input_youtube",
        value: "https://www.youtube.com/watch?v=d_T1StgldnM",
        change: testYouTube
    });
    var h_youtube = $("<div>").appendTo(h);
    testYouTube();
    function testYouTube(){
        if(!input_youtube) return;
        var w = $(window).width() * 0.9;
        var url = input_youtube();
        h_youtube.empty();
        var m,Domain = yaju1919.getDomain(url);
        var query = url.split('?')[1] || '';
        switch(Domain.slice(-2).join('.')){
            case "youtu.be": // YouTube
                m = url.match(/youtu\.be\/([A-Za-z0-9_\-]+)/);
            case "youtube.com":
                if(!m) m = url.match(/[\?&]v=([A-Za-z0-9_\-]+)/);
                if(!m) break;
                $("<iframe>").appendTo(h_youtube).attr({
                    src: "//www.youtube.com/embed/" + m[1]
                }).css({
                    width: w,
                    height: w * (9/16) // 16:9
                });
                break;
        }
        if(!m) $("<div>").appendTo(h_youtube).text("YouTubeの動画URLを入力してください。");
    }
    var input_str = yaju1919.addInputText(h,{
        textarea: true,
        title: "歌詞入力欄",
        placeholder: `810#歌詞←その歌詞が始まる直前に810ミリ秒停止する。
19@歌詞←その歌詞が始まったとき19秒にシークする。
歌詞の中に挿入された#は1文字分waitする。`,
        value: sampleText,
        save: "input_str"
    });
    var input_wait_c = yaju1919.addInputNumber(h,{
        class: "input_wait_c",
        title: "文字間wait時間[ms]",
        int: true,
        max: 5000,
        value: 150,
        min: 0,
        save: "input_wait_c"
    });
    var input_wait_n = yaju1919.addInputNumber(h,{
        class: "input_wait_n",
        title: "改行間wait時間[ms]",
        int: true,
        max: 5000,
        value: 150,
        min: 0,
        save: "input_wait_n"
    });
    $("<button>").appendTo(h).text("マップ作成").on("click",main);
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
    function main(){
        h_output.empty();
        var str = input_str(),
            dic_keys = Object.keys(dic);;
        if(judge(str,dic_keys)) return;
        var s = "",
            x = 33,
            y = 33;
        str.split("\n").forEach((line)=>{
            if(line === '') return;
            if(analysisCmd(line)) return;
            line.replace(/^[0-9]+\$/,function(v){
                var n = Number(v.slice(0,-1));
                if(n) s += addWait(n);
                return '';
            }).replace(/^[0-9]+@/,function(v){
                var n = Number(v.slice(0,-1));
                if(!n) return '';
                s += `
#SK_YB
s:${n},
#ED`;
                return '';
            }).split('').forEach((v,i,a)=>{
                if(v === '\0') return;
                var id = dic[v],
                    waitFlag = v === '#' && (i ? a[i-1] !== '\\' : true);
                if(v === '\\'){
                    if(v !== a[i+1]) return;
                    a[i+1] = '\0';
                }
                if(((i && sute_gana.indexOf(v) === -1) && id) || waitFlag){
                    s += addWait(input_wait_c());
                }
                if(waitFlag) return;
                else if(!id) return x++;
                s += `
#MV_PA
tx:${x},ty:${y},t:0,n:1,s:1,
#ED
#CH_SP
n:${id},tx:${x},ty:${y},l:0,
#ED`;
                x++;
                if(g_floor_ar.indexOf(id) === -1) g_floor_ar.push(id);
            });
            s += addWait(input_wait_n());
            y++;
            x = 33;
        });
        outputBookmarklet(s);
    }
    function changeValue(selector,value){
        $(selector).val(value).trigger("change");
    };
    function judge(str,dic_keys){
        var s = "";
        str.replace(/[\n\r\s　]|[0-9]+[@\$]|[a-zA-Z]+@.+\n|#/g,'').split('').forEach(v=>{
            if(dic_keys.indexOf(v) === -1) s += v;
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
                changeValue(".input_youtube",ar[1]);
                break;
            case 'c':
                changeValue(".input_wait_c",ar[1]);
                break;
            case 'n':
                changeValue(".input_wait_n",ar[1]);
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
    function outputBookmarklet(s){
        var ar = [];
        ar.push("#HERO\n0,15");
        ar.push("#BGM\n");
        ar.push("#BGIMG\nhttps://i.imgur.com/TCdBukE.png");
        ar.push("#FLOOR\n" + g_floor_ar.join(' ') + '\n'.repeat(15) + "45C\n" + '\n'.repeat(17) + ' '.repeat(33) + "45C" + '\n'.repeat(45) + "45");
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
t:3000,
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
#PHEND0
`);
        ar.push(`
#EPOINT tx:33,ty:33,
#PH0 tm:1,
${s}
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

}
