;(() => {
  const editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'markdown',
    fontSize: '14px',
    fontFamily: "'FiraCode NF', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
    fontLigatures: true,
    automaticLayout: true,
    wordWrapMinified: false,
    theme: 'vs-dark'
  })

  editor.addAction({
    id: 'open',
    label: 'Open',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_O],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'file',
    contextMenuOrder: 1.5,
    run() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md'
      input.onchange = () => {
        document.title = input.files[0].name.split('.')[0]
        input.files[0].arrayBuffer().then(arrayBuffer => {
          editor.setValue(new TextDecoder().decode(arrayBuffer))
        })
      }
      input.click()
    }
  })

  editor.addAction({
    id: 'save',
    label: 'Save',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'file',
    contextMenuOrder: 1.6,
    run() {
      const blob = new Blob([editor.getValue()], { type: 'text/plain;charset=utf-8' })

      const saver = document.createElement('a')
      const blobURL = (saver.href = URL.createObjectURL(blob))

      saver.download = document.title + '.md'
      saver.click()
      URL.revokeObjectURL(blobURL)
    }
  })

  editor.addAction({
    id: 'print',
    label: 'Print',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'file',
    contextMenuOrder: 1.7,
    run: () => window.print()
  })

  editor.addAction({
    id: 'image',
    label: 'Upload image',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'insert',
    contextMenuOrder: 1.5,
    run() {
      const input = document.createElement('input')
      input.type = 'file'
      input.onchange = e => {
        const reader = new FileReader()
        reader.onload = event => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const scale = (img.width / img.height) * 9 > 16 ? 1280 / img.width : 720 / img.height
            canvas.width = img.width * scale
            canvas.height = img.height * scale
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
            editor.executeEdits('my-source', [
              {
                identifier: { major: 1, minor: 1 },
                range: editor.getSelection(),
                text: `![Alt text here](${canvas.toDataURL('image/jpeg')})\n`,
                forceMoveMarkers: true
              }
            ])
          }
          img.src = event.target.result
        }
        reader.readAsDataURL(e.target.files[0])
      }
      input.click()
    }
  })

  const md = markdownit({
    html: true,
    xhtmlOut: false,
    breaks: false,
    langPrefix: 'language-',
    linkify: false,
    typographer: true,
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value
        } catch (__) {}
      }

      return ''
    }
  })
  .use(texmath, { engine: katex })
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      class: 'anchor',
      symbol: '<span class="octicon octicon-link"></span>',
      placement: 'before'
    })
  })
  .use(markdownItTocDoneRight)
  .use(markdownitTaskLists)

  editor.onDidChangeModelContent(() => {
    const text = editor.getValue()
    localStorage.setItem('lastText', text)
    document.getElementById('result').innerHTML = md.render(text)
  })

  editor.setValue(localStorage.getItem('lastText') || '')

  document.getElementById('result').innerHTML = md.render(localStorage.getItem('lastText') || '')
})()
