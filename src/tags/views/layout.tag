<html>
  <head>
    <meta charset="UTF-8" />
    <meta charset="UTF-8" name="state" content={ JSON.stringify(this.opts.req.initialState) }/>
    <title>{parent.opts.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <meta name="turbolinks-cache-control" content="no-cache">
    <script src="/dist/boot.js" defer></script>
    <yield from="styles"/>
  </head>
  <body>
    <yield/>
  </body>
  <yield from="scripts"/>
  <script src="/dist/main.js" defer></script>
  <script>
  </script>
</html>