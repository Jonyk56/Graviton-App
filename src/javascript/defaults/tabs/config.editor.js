import Tab from '../../constructors/tab'
import Editor from '../../constructors/editor'
import PluginsRegistry from 'PluginsRegistry'
import StaticConfig from 'StaticConfig'

function updateStaticConfigByKey(client, instance) {
	const newConfig = JSON.parse(client.do('getValue', instance))
	Object.keys(newConfig).map(key => {
		if (StaticConfig.data[key] !== newConfig[key]) StaticConfig.data[key] = newConfig[key]
	})
}

function updateKey(client, instance, key) {
	if (!StaticConfig.data.miscEnableLiveUpdateInManualConfig) return
	const newConfig = JSON.parse(client.do('getValue', instance))
	if (newConfig[key] != StaticConfig.data[key] && key !== 'appCache') {
		const initialCursor = client.do('getCursorPosition', { instance })
		newConfig[key] = StaticConfig.data[key]
		client.do('doChangeValue', {
			instance,
			value: JSON.stringify(newConfig, null, 2),
		})
		client.do('doIndent', {
			instance,
		})
		client.do('setCursorPosition', {
			instance,
			...initialCursor,
		})
	}
}

function configEditor() {
	const { bodyElement, tabElement, tabState, isCancelled } = new Tab({
		title: 'Configuration',
		isEditor: true,
	})
	if (isCancelled) return //Cancels the tab opening
	const clonedStaticConfig = { ...StaticConfig.data }
	delete clonedStaticConfig.appCache
	const { client, instance } = new Editor({
		language: 'json',
		value: JSON.stringify(clonedStaticConfig, null, 3),
		theme: PluginsRegistry.registry.data.list[StaticConfig.data.appTheme].textTheme,
		bodyElement,
		tabElement,
		tabState,
	})
	const editorFontSizeWatcher = StaticConfig.keyChanged('editorFontSize', () => {
		updateKey(client, instance, 'editorFontSize')
	})
	const appZoomWatcher = StaticConfig.keyChanged('appZoom', () => {
		updateKey(client, tabElement, 'appZoom')
	})
	const appThemeWatcher = StaticConfig.keyChanged('appTheme', () => {
		updateKey(client, instance, 'appTheme')
	})
	const tabWatcher = tabElement.state.on('destroyed', () => {
		tabWatcher.cancel()
		editorFontSizeWatcher.cancel()
		appZoomWatcher.cancel()
		appThemeWatcher.cancel()
	})
	client.do('doIndent', { instance }) //Force an initial indentation
	client.do('doFocus', { instance }) //Force an initial indentation
	tabState.emit('savedMe') //Save the tab
	tabElement.state.on('savedMe', () => {
		updateStaticConfigByKey(client, instance)
	})
}
export default configEditor
