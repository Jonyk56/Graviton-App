import { element } from '@mkenzo_8/puffin'
import { css as style } from 'emotion'
import StaticConfig from 'StaticConfig'

const resizeSelector = Math.random()

let resizerBlocked = !StaticConfig.data.appEnableSidepanel
let resizerOffset = StaticConfig.data.appEnableSidebar ? 85 : 55

StaticConfig.keyChanged('appEnableSidebar', status => {
	if (status) {
		resizerOffset = 85
	} else {
		resizerOffset = 55
	}
})

function startResizing(event, resizerElement = document.getElementById(resizeSelector)) {
	if (resizerBlocked) return
	const otherChildren = resizerElement.parentElement.children
	let leftPanel = null
	Object.keys(otherChildren).forEach(index => {
		const child = otherChildren[index]
		if (child.id == resizerElement.id) {
			leftPanel = otherChildren[index - 1]
		}
	})
	leftPanel.style.width = `${event.clientX - resizerOffset}px`
}

const styleWrapper = style`
	&{
		user-select: none;
		cursor:e-resize;
	}
	&[blocked=false]{
		padding:3px;
	}
`

function stopResizing() {
	window.removeEventListener('mousemove', startResizing, false)
	window.removeEventListener('mouseup', stopResizing, false)
}

function resizerMounted() {
	StaticConfig.keyChanged('appEnableSidepanel', value => {
		resizerBlocked = !value
		if (!value) this.style.width = '0'
		this.update()
	})
}

function resizerComponent() {
	return element`
		<div blocked="${() => resizerBlocked}" mounted="${resizerMounted}" id="${resizeSelector}" :mousedown="${working}" class="${styleWrapper}"/>
	`
}

function working() {
	window.addEventListener('mousemove', startResizing, false)
	window.addEventListener('mouseup', stopResizing, false)
}
export default resizerComponent
