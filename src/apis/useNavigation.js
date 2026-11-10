import { ref } from 'vue'
import { mockData } from '../mock/mock_data.js'

/** 搜索引擎只保留这两个，其它值一律回落到 bing */
const ENGINES = ['bing', 'baidu']

export function useNavigation() {
  const categories = ref([])
  const title = ref('')
  const footer = ref({ text: '愿逐月华流照君', url: '' })
  const icpNumber = ref('')
  const defaultSearchEngine = ref('bing')
  const loading = ref(false)
  const error = ref(null)

  const applyMeta = (data) => {
    title.value = data.title || '导航'

    // 页脚链接（侧边栏底部那行），缺字段时退回默认文案
    const f = data.footer || {}
    footer.value = {
      text: f.text || '愿逐月华流照君',
      url: f.url || ''
    }

    icpNumber.value = data.icp || ''

    defaultSearchEngine.value = ENGINES.includes(data.search) ? data.search : 'bing'

    document.title = title.value
  }

  const fetchCategories = async () => {
    loading.value = true
    error.value = null

    try {
      // 开发环境模拟网络延迟
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // 默认使用本地mock数据
      categories.value = mockData.categories
      applyMeta(mockData)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching categories:', err)
      // 兜底：始终返回 mock 数据
      categories.value = mockData.categories
      applyMeta(mockData)
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    title,
    footer,
    icpNumber,
    defaultSearchEngine,
    loading,
    error,
    fetchCategories
  }
}
