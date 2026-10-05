<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>Bigi Badminton</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
  </head>
  <body class="bg-zinc-950 text-zinc-100 antialiased selection:bg-purple-600 selection:text-white">
    @inertia
  </body>
</html>
