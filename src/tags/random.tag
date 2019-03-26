<random>
  <h3>{ opts.title }</h3>

  <button onclick={ generate }>
    Generate
  </button>

  <h1>
    { number }
  </h1>

  <logs logs={ logs } onclear={ clearLogs }></logs>

  <script>
    import './logs.tag'
    

    this.on('server', async ()=>{
      await this.generate({ type: 'custom' })
    })

    this.number = null
    this.logs = []
    
    
    this.generate = async (e) => {
      this.await('generating number')
      return new Promise( resolve => setTimeout(() => {
        this.logs.push({ text: `Generate button clicked. Event type is ${ e.type }` })
        this.number = Math.floor(Math.random()*10000)
        this.update()
        this.done('generating number');
       }, 1000));
    }

    this.clearLogs = (e) => {
      this.logs = []
    }

    this.on('update', ()=>{
      console.log(this._id, this.data)
    })
    
    
  </script>
</random>
