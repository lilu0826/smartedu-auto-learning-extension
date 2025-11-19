

webpackChunkchat_group_vue.push([
    [99999],
    {},
    (r) => { window.wr = r }
]);
// 用来挂全局的函数
function exposeLibs(runtime) {
    const exportsMap = {};

    for (const id in runtime.m) {
        const moduleFactory = runtime.m[id];
        if (typeof moduleFactory === 'function') {
            const exp = {};
            try {
                moduleFactory({ exports: exp }, exp, runtime);
            } catch (e) {
                // 某些模块执行可能报错，忽略
            }
            const candidate = exp.default || exp;


            if (candidate && candidate.version) {
                console.log("candidate", exp)
            }


            // 判断 axios
            if (!exportsMap.axios && candidate && candidate.get && candidate.post && candidate.defaults) {
                exportsMap.axios = candidate;
            }

            // 判断 Vue
            if (!exportsMap.Vue && candidate && candidate.version && candidate.component && candidate.directive) {
                exportsMap.Vue = candidate;
            }

            // 判断 ElementUI
            if (!exportsMap.ElementUI && candidate && candidate.install && candidate.version && candidate.Button) {
                exportsMap.ElementUI = candidate;
            }

            // 提前结束判断
            if (exportsMap.axios && exportsMap.Vue && exportsMap.ElementUI) break;
        }
    }

    // 挂到全局
    for (const key in exportsMap) {
        window[key] = exportsMap[key];
        console.log(`✅ ${key} 已挂到 window`);
    }

    return exportsMap;
}

// 执行
exposeLibs(wr);










const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCourseDetails(param) {
    const res = await axios({
        url: '/studyCourse/getCourseDetails?courseId=' + param,
        method: 'get'
    });
    return res.returnData;
}



// 获取进程
async function findCourseStudyDetail(param) {
    const res = await axios({
        url: '/studyCourseUser/process?courseId=' + param,
        method: 'get'
    });
    return res.returnData;
}


async function recordStudyProcess(param) {
    const res = await axios({
        url: '/studyCourseUser/recordProcess',
        method: 'post',
        data: param
    });

    // if (res.returnData != 1) {
    //     console.log("param", param)
    // }

    return res.returnData;
}


async function refreshProcess(param) {
    const res = await axios({
        url: '/studyCourseUser/refreshProcess',
        method: 'post',
        data: param
    });

    return res.returnData;
}


async function getSubsectionDetail(param) {
    const res = await axios({
        url: '/studySubsection/getSubsectionDetail',
        method: 'post',
        data: param
    });

    return res.returnData;
}



// recordStudyProcess({ 
//     "courseId": "1983474287572594688", //课程ID
//     "chapterId": "1983474473980047360", //章节ID
//     "subsectionId": "1983475172650430464", // 子节点ID
//     "studyTime": 500,   //观看时间
//     "state": "2"  // 当前状态
// })



if (window.Vue) {

    // debugger

    const div = document.createElement("div");
    document.body.appendChild(div);


    console.log("div")
    const app = new Vue({
        el: div,
        data() {
            return {
                title: "自动学习中...请保持窗口不关闭",
                gridData: [],
                dialogTableVisible: false,
                style: {
                    position: "fixed",
                    top: "109px",
                    right: "37px",
                    margin: "auto",
                    background: "white",
                    padding: "10px",
                    height: "fit-content",
                    width: "fit-content",
                    zIndex: "10",
                },
                show: true,
            };
        },
        // template: `
        //     <div :style="style" v-if="show">
        //         <el-button type="primary" @click="dialogTableVisible = true">开始自动学习</el-button>
        //     </div>
        // `,
        render(h) {
            return this.show
                ? h(
                    'div',
                    { style: this.style },
                    [
                        h(
                            'button',
                            {
                                attrs: { type: 'primary' },
                                on: {
                                    click: async () => {
                                        while (true) {
                                            try {
                                                await this.handleClick()
                                                break;
                                            } catch (error) {
                                                await delay(3000);
                                                console.log("error", error)
                                            }
                                        }
                                    }
                                }
                            },
                            '一键学习'
                        )
                    ]
                )
                : null;
        },
        methods: {
            async handleClick() {
                const query = new URLSearchParams(window.location.search)
                console.log("query", query.get("courseId"))
                const courseId = query.get("courseId")
                if (!courseId) {
                    alert("未获取到课程id，请点击某个课程进入课程培训列表页！")
                }

                const courseInfo = await getCourseDetails(courseId)

                console.log("课程信息", courseInfo)

                const chapters = courseInfo.chapters

                console.log("获取章节", chapters)

                

                for (const [chapterIndex,chapter] of chapters.entries()) {
                    for (const [sectionIndex,section] of chapter.studySubsections.entries()) {
                        const { courseId, chapterId, id: subsectionId } = section
                        const { state, videoTime } = section.studyFiles

                        console.log("遍历每个章节：", courseId, chapterId, subsectionId, videoTime)

                        document.querySelector(".courseIntro").innerText = `正在学习：${chapterIndex + 1}-${sectionIndex + 1}`

                        if(state != '3'){
                            // await refreshProcess({
                            //     "courseId": courseId, //课程ID
                            //     "chapterId": chapterId, //章节ID
                            //     "subsectionId": subsectionId, // 子节点ID
                            //     "studyTime": 0,   //观看时间
                            // })
    
                            let recordValue = 2
                            while (recordValue != 1) {
                                await delay(1000 * 45)
                                recordValue = await recordStudyProcess({
                                    "courseId": courseId, //课程ID
                                    "chapterId": chapterId, //章节ID
                                    "subsectionId": subsectionId, // 子节点ID
                                    "studyTime": parseInt(videoTime),   //观看时间 parseInt(videoTime) + 1
                                    "state": "2"  // 当前状态
                                })
                            }
                            console.log("recordValue",recordValue)
                        }
                        console.log("该章节学习完毕")
                    }
                }
                window.location.reload()
            },
        },
    });

    window.app = app

    function show() {
        if (location.hash.includes("onlineLearn/myLearn")) {
            app.show = true;
        } else {
            app.show = true;
        }
    }
    show();
    setInterval(() => {
        show();
    }, 1000);
}

