import { NButton, NProgress, NStep } from 'naive-ui'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    percentage: {
      type: Number,
      default: 0,
    },
    log: {
      type: String,
      default: '',
    },
  },
  emits: {
    saveToDisk(_ref?: any) {},
    generateClick() {},
    uploadS3() {},
  },
  setup(props, context) {
    const isShowDirectoryPickerSupported = computed(() => {
      return 'showDirectoryPicker' in globalThis
    })

    /** 此为实验性api */
    async function saveToDisk() {
      //@ts-ignore
      const dir_ref = await showDirectoryPicker({ mode: 'readwrite' })
      if (!dir_ref) {
        console.log('showDirectoryPicker() 未返回有效值')

        // User cancelled, or otherwise failed to open a directory.
        return
      }
      context.emit('saveToDisk', dir_ref)
    }

    return () => (
      <NStep
        title="开始生成"
        description="点击开始生成后请耐心等待，生成完成后会自动弹出下载"
      >
        <div>
          <NButton
            type="success"
            loading={props.percentage > 0 && props.percentage < 100}
            onClick={() => context.emit('generateClick')}
          >
            开始生成
          </NButton>{' '}
          <NButton
            disabled={!isShowDirectoryPickerSupported}
            type="success"
            loading={props.percentage > 0 && props.percentage < 100}
            onClick={() => saveToDisk()}
          >
            保存到本地磁盘
          </NButton>
          <NProgress
            type="line"
            percentage={props.percentage}
            indicator-placement="inside"
            style={{ marginTop: '12px' }}
          />
          <pre>{props.log}</pre>
        </div>
      </NStep>
    )
  },
})
