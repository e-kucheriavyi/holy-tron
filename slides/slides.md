---
theme: default
title: Multiplayer on JS
class: text-center
drawings:
  persist: false
comark: true
lineNumbers: true
background: /aero-1.png
---

<Wordart variant="9">Мультиплеер на JS</WordArt>

<Wordart variant="16">Женя Кучерявый</WordArt>

---
layout: cover
class: text-center
background: /aero-5.png
---

<Wordart variant="21">Что делаем?</Wordart>

---
layout: two-cols
transition: none
---

<Window>

# Вот тут все ссылки и материалы.

<br>

# Там же можно поиграть

</Window>

::right::

<br>
<br>

<Qr data="https://tron.larana.tech" label="tron.larana.tech" />

---
layout: image-left
image: /tron-1.jpg
backgroundSize: 60rem
transition: none
---

<br>
<br>

<Qr data="https://tron.larana.tech" label="tron.larana.tech" />


---
layout: image-left
image: /tron-0.png
transition: none
---

<br>
<br>

<Qr data="https://tron.larana.tech" label="tron.larana.tech" />

---
layout: two-cols
transition: none
---

<Window title="Правила игры">

<v-clicks>

- Игрок всегда движется
- Можно двигаться налево, направо, вверх или вниз
- Игрок оставляет за собой след
- Столкновение со следом любого игрока или выход за пределы арены — смерть
- Побеждает последний выживший

</v-clicks>

</Window>

::right::

<br>
<br>

<Qr data="https://tron.larana.tech" label="tron.larana.tech" />

---
layout: two-cols
---

<Window title="Этапы">

<v-clicks>

1. Играем в браузере
2. Подключаемся по веб-сокету
3. Рисуем

</v-clicks>

<br>

<v-click>

### Перерыв

</v-click>

<br>

<v-clicks>

4. Пишем бота

</v-clicks>


</Window>

::right::

<br>
<br>

<Qr data="https://tron.larana.tech" label="tron.larana.tech" />

---
layout: cover
class: text-center
background: /aero-1.png
---

<Wordart variant="16">Часть 1: Играем</Wordart>

---
preload: false
---

<!-- <iframe src="https://tron.larana.tech/play" style="width: 100%; height: 100%;"></iframe> -->

<Wordart variant="16">tron.larana.tech</Wordart>

---
layout: cover
class: text-center
background: /aero-6.png
---

<Wordart variant="11">ВАЙБКОДЕРЫ, ВНИМАНИЕ</Wordart>

---
layout: image
image: /cd-cup-holder.jpg
backgroundSize: center
---

---
layout: image
image: /dmb.jpg
---

---
layout: image
image: /vasya-tron.jpg
backgroundSize: 61rem
---

---
layout: cover
class: text-center
background: /aero-3.jpg
---

<Wordart variant="11">Часть 2: Подключение</Wordart>

---

<Window title="Часть 2: Подключение">

<v-clicks>

- wss://tron.larana.tech/ws
- Первым сообщением после подключения отправьте свой ник
- Для поворота отправьте код направления

</v-clicks>

</Window>

<br>

<Window title="Direction" code v-click>

```ts
const Direction = {
    LEFT:  "l",
    RIGHT: "r",
    UP:    "u",
    DOWN:  "d",
} as const
```

</Window>

---

<Window title="example" code>

````md magic-move
```ts
const ws = new WebSocket("wss://tron.larana.tech/ws")
```

```ts
const ws = new WebSocket("wss://tron.larana.tech/ws")

ws.addEventListener("open", () => {
    ws.send("Nickname")
})
```

```ts
const ws = new WebSocket("wss://tron.larana.tech/ws")

ws.addEventListener("open", () => {
    ws.send("Nickname")
})

leftBtn.addEventListener("click", () => {
    ws.send("l")
})
```

```ts
const ws = new WebSocket("wss://tron.larana.tech/ws")

ws.addEventListener("open", () => {
    ws.send("Nickname")
})

leftBtn.addEventListener("click",  () => { ws.send("l") })
rightBtn.addEventListener("click", () => { ws.send("r") })
upBtn.addEventListener("click",    () => { ws.send("u") })
downBtn.addEventListener("click",  () => { ws.send("d") })
```

````

</Window>

---


<Window code>

````md magic-move

```ts
const msg = {
    direction: "right",
}

ws.send(JSON.stringify(msg))

// > 21 bytes
// ~2 KB/s
```

```ts
ws.send("r")
// 1 byte
// 100 B/s
```

````

</Window>

---
layout: cover
class: text-center
background: /aero-4.png
---

<Wordart variant="9">Часть 3: Рисуем</Wordart>

---
layout: two-cols
---

# Часть 3: Рисуем

<Window>

# Рисуйте чё по кайфу

</Window>

::right::

<Qr data="https://tron.larana.tech" label="tron.larana.tech"/>

---
layout: cover
class: text-center
background: /aero-1.png
---

<Wordart variant="3">Datamoshing</Wordart>

---

<Window title="Datamoshing" style="height: 100%">

<Moshing />

</Window>

---
layout: two-cols
class: p-1
---

<Window title="Последствия для видео">

<v-clicks>

- ## Кратковременный визуальный артефакт

</v-clicks>

</Window>

::right::

<Window title="Последствия для игры">

<v-clicks>

- ## смерть
- ## рейдж лив
- ## стоп донат

</v-clicks>

</Window>

---

# Спасибо

