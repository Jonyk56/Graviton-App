import SidePanel from '../../constructors/side.panel'
import RunningConfig from 'RunningConfig'
import { element, render } from '@mkenzo_8/puffin'
import EnvOutlined from '../../components/icons/env.outlined'
import Explorer from '../../constructors/explorer'
const { basename } = window.require('path')
import EnvClient from '../../constructors/env.client'
import Notification from '../../constructors/notification'
import detectEnv from '../../utils/detect.env'

RunningConfig.on('appLoaded', () => {
	const { display, panelNode } = new SidePanel({
		icon: EnvOutlined,
		panel: () => element`<div/>`,
		hint: 'Project inspector',
	})
	RunningConfig.on('addFolderToRunningWorkspace', async ({ folderPath }) => {
		const { env, prefix, info } = await detectEnv(folderPath)
		if (env && info) {
			const envExplorer = new Explorer({
				items: [
					{
						label: basename(folderPath),
						decorator: {
							label: env,
						},
						items: getKeysToItems(info, folderPath, '', prefix),
					},
				],
			})
			const explorerNode = render(envExplorer, panelNode.children[0])
			RunningConfig.on('removeFolderFromRunningWorkspace', ({ folderPath: removedFolderPath }) => {
				if (folderPath == removedFolderPath) {
					explorerNode.remove()
				}
			})
		}
	})
})

function getKeysToItems(keys, folder, fromKey, prefix = '') {
	return Object.keys(keys).map(key => {
		const item = {
			label: key,
		}
		if (fromKey == 'scripts') {
			item.action = () => {
				executeScript(prefix, folder, key)
			}
		}
		if (typeof keys[key] == 'object') {
			item.items = getKeysToItems(keys[key], folder, key, prefix)
		}
		return item
	})
}

function executeScript(prefix, folder, script) {
	const { exec } = window.require('child_process')

	const scriptEnvClient = new EnvClient({
		name: script,
	})
	let scriptProcess
	scriptEnvClient.on('start', () => {
		scriptProcess = exec(`${prefix} ${script}`, {
			stdio: 'inherit',
			shell: true,
			detached: true,
			cwd: folder,
		})
		scriptProcess.stdout.on('data', data => {
			new Notification({
				title: script,
				content: data,
			})
		})
		scriptProcess.stdout.on('data', data => {
			new Notification({
				title: script,
				content: data,
			})
		})
		scriptProcess.on('close', data => {
			scriptEnvClient.emit('stop')
		})
	})
	scriptEnvClient.on('stop', () => {
		scriptProcess && scriptProcess.kill()
	})
}
