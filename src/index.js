const proxyHandler = instance => {
  return {
    get (obj, prop) {
      const val = obj[prop]
      if (typeof val === 'object' && val !== null) {
        return new Proxy(val, proxyHandler(instance))
      }
      return val
    },
    set (obj, prop, value) {
      obj[prop] = value
      debounceRender(instance)
      return true
    },
    deleteProperty (obj, prop) {
      delete obj[prop]
      debounceRender(instance)
      return true
    }
  }
}

const debounceRender = instance => {
  // If there's a pending render, cancel it
  if (instance.debounce) {
    window.cancelAnimationFrame(instance.debounce)
  }

  // Setup the new render to run at the next animation frame
  instance.debounce = window.requestAnimationFrame(instance.render.bind(instance))
}

/**
 * Convert a template string into HTML DOM nodes
 * @param  {String} str The template string
 * @return {Node}       The template HTML
 */
const stringToHTML = str => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return doc.body
}

/**
 * Get the type for a node
 * @param  {Node}   node The node
 * @return {String}      The type
 */
const getNodeType = node => {
  if (node.nodeType === 3) return 'text'
  if (node.nodeType === 8) return 'comment'
  return node.tagName.toLowerCase()
}

/**
 * Get the content from a node
 * @param  {Node}   node The node
 * @return {String}      The type
 */
const getNodeContent = node => {
  if (node.childNodes && node.childNodes.length > 0) return null
  return node.textContent
}

const on = (event, func, key, templateNode) => {
  // add marker to the node to prevent assignment of multiple event listeners
  if (!templateNode.hasAttribute(`vo${event}:${key}`)) {
    templateNode.addEventListener(event, func)
    templateNode.setAttribute(`vo${event}:${key}`, '')
  }
}

const setDirectives = (node, instance, applyToChildren = false, templateNode) => {
  // continue with rendering of text/comment elements. Node.ELEMENT_NODE == 1
  if (node.nodeType !== 1) return true
  const attrs = node.attributes
  const templateAttrs = templateNode ? Array.from(templateNode.attributes).map(attr => attr.nodeName) : []

  for (let i = attrs.length - 1; i >= 0; i--) {
    const attrName = attrs[i].name
    const attrValue = attrs[i].value

    const index = templateAttrs.indexOf(attrName)
    if (index > -1) {
      // both template node and current node have this attribute, check if values are same
      templateAttrs.splice(index, 1)
    }
    if (!attrName.startsWith('v-')) {
      if (!templateNode) continue

      // const index = templateAttrs.indexOf(attrName);
      if (index > -1) {
        // both template node and current node have this attribute, check if values are same
        const refAttrValue = templateNode.getAttribute(attrName)
        if (attrValue !== refAttrValue) {
          node[attrName] = attrValue
          node.setAttribute(attrName, attrValue)
        }
      } else {
        // the template node does not have this attribute, remove it from current node
        node.removeAttribute(attrName)
      }
    }

    if (attrName === 'v-if') {
      const res = (attrValue === 'true')
      if (!res) {
        // if it's a child item, remove it
        if (node.parentNode) node.parentNode.removeChild(node)
        return false // do not render the node (if it's a root element)
      }
    }

    if (attrName.startsWith('v-on:')) {
      // add event listener
      const event = attrName.substr(5)
      on(event, instance.data[attrValue].bind(instance.data), attrValue, node)
    }

    if (attrName.startsWith('v-bind:')) {
      const attr = attrName.substr(7)
      const val = typeof instance.data[attrValue] === 'function' ? instance.data[attrValue]() : instance.data[attrValue]
      if (val === undefined) {
        delete node[attr]
        node.removeAttribute(attr)
      } else {
        node[attr] = val
        node.setAttribute(attr, val)
      }
    }

    if (attrName === 'v-model') {
      const func = e => { instance.data[attrValue] = e.target.value }
      on('input', func, attrValue, node)
      node.value = instance.data[attrValue]
    }
  }

  for (const extraAttributes of templateAttrs) {
    // add attributes that current is missing compared to template node
    const attrValue = templateNode.getAttribute(extraAttributes)
    node[extraAttributes] = attrValue
    node.setAttribute(extraAttributes, attrValue)
  }

  if (!applyToChildren) return true
  const children = Array.prototype.slice.call(node.childNodes)
  children.forEach(elm => setDirectives(elm, instance, true))
}

/**
 * Compare the template to the UI and make updates
 * @param  {Node} template The template HTML
 * @param  {Node} elem     The UI HTML
 */
const diff = (template, elem, instance) => {
  // Get arrays of child nodes
  const domNodes = Array.prototype.slice.call(elem.childNodes)
  const templateNodes = Array.prototype.slice.call(template.childNodes)

  // If extra elements in DOM, remove them
  let count = domNodes.length - templateNodes.length
  if (count > 0) {
    for (; count > 0; count--) {
      domNodes[domNodes.length - count].parentNode.removeChild(domNodes[domNodes.length - count])
    }
  }

  // Diff each item in the templateNodes
  templateNodes.forEach(function (node, index) {
    const shallRender = setDirectives(node, instance, true)
    if (shallRender === false) {
      if (domNodes[index] && getNodeType(node) === getNodeType(domNodes[index])) {
        // remove it, if added before
        domNodes[index].parentNode.removeChild(domNodes[index])
      }
      return
    }

    // If element doesn't exist, create it
    if (!domNodes[index]) {
      elem.appendChild(node)
      return
    }

    // If element is not the same type, replace it with new element
    if (getNodeType(node) !== getNodeType(domNodes[index])) {
      domNodes[index].parentNode.replaceChild(node, domNodes[index])
      return
    }

    // update attributes and directives like v-on, v-bind, v-mode which requires a propery name in data
    setDirectives(domNodes[index], instance, false, node)

    // If content is different, update it
    const templateContent = getNodeContent(node)
    if (templateContent && templateContent !== getNodeContent(domNodes[index])) {
      domNodes[index].textContent = templateContent
    }

    // If target element should be empty, wipe it
    if (domNodes[index].childNodes.length > 0 && node.childNodes.length < 1) {
      domNodes[index].innerHTML = ''
      return
    }

    // If element is empty and shouldn't be, build it up
    // This uses a document fragment to minimize reflows
    if (domNodes[index].childNodes.length < 1 && node.childNodes.length > 0) {
      const fragment = document.createDocumentFragment()
      diff(node, fragment, instance)
      domNodes[index].appendChild(fragment)
      return
    }

    // If there are existing child elements that need to be modified, diff them
    if (node.childNodes.length > 0) {
      diff(node, domNodes[index], instance)
    }
  })
}

export default class Bear {
  constructor (options) {
    this.template = options.template
    this.methods = options.methods
    this.attach(options.element)
    this.data = new Proxy(
      typeof options.data === 'function' ? options.data() : options.data,
      proxyHandler(this)
    )
  }

  /**
   * sets the node element which app will be rendered
   * @param  {el} either a querySelector string or a node element
  */
  attach (el) {
    this.elem = typeof el === 'string' ? document.querySelector(el) : el
    return this.elem
  }

  /**
   * Renders UI from the template
  */
  render () {
    if (!this.elem) return
    const templateHTML = stringToHTML(this.template.call(this.data))

    // Diff the DOM
    diff(templateHTML, this.elem, this)
  }
}
