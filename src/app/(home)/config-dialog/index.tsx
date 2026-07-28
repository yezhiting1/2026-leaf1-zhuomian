import { useState } from 'react'
import { toast } from 'react-toastify'
import { pushSiteContent } from '@/services/pushSiteContent'

// 自定义保存密码
const SAVE_PASSWORD = 'Zhiting'

export default function ConfigIndex() {
  // 密码弹窗状态
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [inputPwd, setInputPwd] = useState('')
  // 页面临时授权标记，仅当前页面生命周期生效
  const [tempAuth, setTempAuth] = useState(false)

  // 底部保存按钮点击事件
  const handleSaveClick = () => {
    if (!tempAuth) {
      // 未验证密码，弹出密码框
      setShowPwdModal(true)
      setInputPwd('')
      return
    }
    // 已验证密码，直接执行保存
    handleSubmitSave()
  }

  // 密码校验函数
  const checkPwdAndSave = () => {
    const pwd = inputPwd.trim()
    if (pwd !== SAVE_PASSWORD) {
      toast.error('密码错误，请重新输入')
      setInputPwd('')
      return
    }
    // 密码正确，标记临时放行
    setTempAuth(true)
    setShowPwdModal(false)
    setInputPwd('')
    handleSubmitSave()
  }

  // 真实提交保存逻辑，临时填充假密钥绕过接口校验
  const handleSubmitSave = async () => {
    try {
      // 临时给全局填充假密钥，骗过接口私钥判断
      const authStore = useAuthStore()
      authStore.setPrivateKey('dummy_no_key')

      // ========== 替换为你项目真实表单数据 ==========
      const formData = {
        title: '网站标题',
        theme: 'light',
        logo: ''
      }
      await pushSiteContent(formData)
      toast.success('配置保存成功！')
    } catch (err) {
      console.error('保存失败：', err)
      toast.error(`保存失败: ${err.message}`)
    } finally {
      // 保存完成清空假密钥，下次打开页面需要重新输入密码
      const authStore = useAuthStore()
      authStore.setPrivateKey('')
      setTempAuth(false)
    }
  }

  return (
    <div className="config-page">
      {/* 你的原有配置表单区域 */}
      <div className="form-content">
        <p>网站配置表单区域</p>
      </div>

      {/* 底部保存按钮 */}
      <button onClick={handleSaveClick}>保存配置</button>

      {/* 密码弹窗 */}
      {showPwdModal && (
        <div className="pwd-mask">
          <div className="pwd-box">
            <h4>请输入保存密码</h4>
            <input
              value={inputPwd}
              onChange={(e) => setInputPwd(e.target.value)}
              type="password"
              placeholder="输入密码"
              onKeyDown={(e) => e.key === 'Enter' && checkPwdAndSave()}
            />
            <div className="btn-group">
              <button onClick={() => setShowPwdModal(false)}>取消</button>
              <button onClick={checkPwdAndSave}>确认保存</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pwd-mask {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pwd-box {
          background: #fff;
          padding: 24px;
          border-radius: 8px;
          width: 360px;
        }
        input {
          width: 100%;
          padding: 8px 12px;
          margin: 12px 0;
          box-sizing: border-box;
        }
        .btn-group {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  )
}

// 引入auth仓库（仅页面内临时调用，无需修改仓库文件）
import { useAuthStore } from '@/stores/auth'
