Object.keys(window).forEach((key) => {
    if (key.startsWith("webpackChunk")) {
        console.log(key);
        window[key].push([
            [99999],
            {},
            (r) => {
                window.wr = r;
            },
        ]);
    }
});
// 用来挂全局的函数
function exposeLibs(runtime) {
    if (!runtime) return;
    const exportsMap = {};
    for (const id in runtime.m) {
        let exp = runtime(id);

        const candidate = exp.default || exp;

        if (candidate && candidate.version) {
            console.log("candidate", id, exp);
        }

        // 判断 axios
        if (
            !exportsMap.axios &&
            candidate &&
            candidate.get &&
            candidate.post &&
            candidate.defaults
        ) {
            exportsMap.axios = candidate;
        }

        // 判断 Vue
        if (
            !exportsMap.Vue &&
            candidate &&
            candidate.version &&
            candidate.component &&
            candidate.directive
        ) {
            exportsMap.Vue = candidate;
        }

        // 判断 ElementUI
        if (
            !exportsMap.ElementUI &&
            candidate &&
            candidate.install &&
            candidate.version &&
            candidate.Button
        ) {
            exportsMap.ElementUI = candidate;
        }

        // 提前结束判断
        if (exportsMap.axios && exportsMap.Vue && exportsMap.ElementUI) break;
    }

    // 挂到全局
    for (const key in exportsMap) {
        window[key] = exportsMap[key];
        console.log(`✅ ${key} 已挂到 window`);
    }

    return exportsMap;
}

// 执行
exposeLibs(window.wr);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCourseDetails(param) {
    const res = await axios({
        url: "/studyCourse/getCourseDetails?courseId=" + param,
        method: "get",
    });
    return res.returnData;
}

async function recordStudyProcess(param) {
    const res = await axios({
        url: "/studyCourseUser/recordProcess",
        method: "post",
        data: param,
    });
    return res.returnData;
}
if (window.Vue) {
    // debugger

    const div = document.createElement("div");
    document.body.appendChild(div);

    console.log("div");
    const app = new Vue({
        el: div,
        data() {
            return {
                isStart: false,
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
                ? h("div", { style: this.style }, [
                      h(
                          "el-button",
                          {
                              attrs: { type: "primary", loading: this.isStart },
                              on: {
                                  click: async () => {
                                      while (true) {
                                          try {
                                              await this.handleClick();
                                              break;
                                          } catch (error) {
                                              await delay(3000);
                                              console.log("error", error);
                                          }
                                      }
                                  },
                              },
                          },
                          this.isStart ? "学习中..." : "一键学习"
                      ),
                  ])
                : null;
        },
        methods: {
            async handleClick() {
                if (this.isStart) {
                    return;
                }
                const query = new URLSearchParams(window.location.search);
                console.log("query", query.get("courseId"));
                const courseId = query.get("courseId");
                if (!courseId) {
                    this.$alert(
                        "未获取到课程id，请点击某个课程进入课程培训详情页！"
                    );
                    return;
                }

                this.isStart = true;
                while (true) {
                    try {
                        await this.study(courseId);
                        break;
                    } catch (error) {
                        await delay(3000);
                        console.log("error", error);
                    }
                }
            },
            async study(courseId) {
                const loading = this.$loading({
                    target: document.querySelector(".courseTxt"),
                    lock: true,
                    text: `正在自动学习...`,
                    // background: "rgba(0, 0, 0, 0.7)",
                });
                const courseInfo = await getCourseDetails(courseId);
                const chapters = courseInfo.chapters;
                for (const [chapterIndex, chapter] of chapters.entries()) {
                    for (const [
                        sectionIndex,
                        section,
                    ] of chapter.studySubsections.entries()) {
                        const {
                            courseId,
                            chapterId,
                            id: subsectionId,
                        } = section;
                        const { state, videoTime } = section.studyFiles;

                        // console.log(
                        //     "遍历每个章节：",
                        //     courseId,
                        //     chapterId,
                        //     subsectionId,
                        //     videoTime
                        // );
                        loading.text = `正在自动学习：${chapterIndex + 1}-${
                            sectionIndex + 1
                        }`;
                        if (state != "3") {
                            let recordValue = 0;
                            while (recordValue != 1) {
                                await delay(1000 * 45);
                                recordValue = await recordStudyProcess({
                                    courseId: courseId, //课程ID
                                    chapterId: chapterId, //章节ID
                                    subsectionId: subsectionId, // 子节点ID
                                    studyTime: parseInt(videoTime), //观看时间 parseInt(videoTime) + 1
                                    state: "2", // 当前状态
                                });
                            }
                        }
                    }
                }
                window.location.reload();
            },
        },
    });

    window.app = app;
}
