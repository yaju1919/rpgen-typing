$.get("sample/184.txt",loaded);
function loaded(sampleText){

    var h = $("<div>").appendTo($("body")).css({
        "text-align": "center",
        padding: "1em"
    });
    $("<h1>",{text:"RPGENのタイピングマップメーカー"}).appendTo(h);
    $("<div>",{text:"歌詞などをタイピングマップ化"}).appendTo(h);
    var input_youtube = yaju1919.addInputText(h,{
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
        title: "文字間wait時間[ms]",
        int: true,
        max: 5000,
        value: 150,
        min: 0,
        save: "input_wait_c"
    });
    var input_wait_n = yaju1919.addInputNumber(h,{
        title: "改行間wait時間[ms]",
        int: true,
        max: 5000,
        value: 150,
        min: 0,
        save: "input_wait_n"
    });
    $("<button>").appendTo(h).text("マップ作成").on("click",main);
    var output = $("<div>").appendTo(h);
    var sute_gana = "ぁぃぅぇぉゕゖっゃゅょゎァィゥェォヵヶッャュョヮ";
    function addWait(s){
        return Number(s) === 0 ? '' : `
#WAIT
t:${s},
#ED`;
    }
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
            line.replace(/^([0-9]+)#/,function(v){
                var n = Number(v.slice(0,-1));
                if(n) s += addWait(n);
                return '';
            }).replace(/^([0-9]+)@/,function(v){
                var n = Number(v.slice(0,-1));
                if(!n) return '';
                s += `
#SK_YB
s:${n},
#ED`;
                return '';
            }).split('').forEach((v,i)=>{
                var id = dic[v],
                    waitFlag = v === '#';
                if(((i && sute_gana.indexOf(v) === -1) && id) || waitFlag){
                    s += addWait(wait_c);
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
            s += addWait(wait_n);
            y++;
            x = 33;
        });
        outputBookmarklet(s);
    }
    function judge(str,dic_keys){
        var s = "";
        str.replace(/[\n\r\s　]|[0-9]+[#@]|#/g,'').split('').forEach(v=>{
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
        yaju1919.addInputText(output.empty(),{
            value: str,
            textarea: true,
            readonly: true
        });
    }

}
