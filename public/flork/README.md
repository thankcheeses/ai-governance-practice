# FLORK illustrations

Twelve FLORK meme images, used as a study mascot on empty and completion states.
Wired into the app through `src/components/app/flork-art.tsx`.

This folder differs from `public/ui-kit/`, which holds reference rasters that are
deliberately *not* wired into anything. These are in use.

---

## Provenance

**These are third-party FLORK meme artwork.** They are not original to this
project, were not commissioned for it, and were not generated. They were supplied
by the project owner on 13 September 2026 and committed **exactly as supplied**:
not redrawn, not regenerated, not restyled, not substituted, and with no
generated approximation produced at any stage of the process.

Each file is byte-identical to the image that was supplied. The sha256 below is
the hash of both the supplied file and the committed file — they are the same
bytes, which is what makes that claim checkable rather than asserted.

| File | Supplied as | Pixels | sha256 |
| --- | --- | --- | --- |
| `overwhelmed-equations.jpg` | `12e1c135-image.jpg` | 736×736 | `046cc85f7ab0cd9f0722f1f049c23094f9a413a582001bd0db16c2b20b41218f` |
| `reading.jpg` | `3bacd949-image.jpg` | 736×736 | `43710bf86e0f08b457639380e835b073430ff0f7a12644b17cb9e3954734a8bf` |
| `idea.jpg` | `74af1be0-image.jpg` | 720×703 | `9a067bfeae47134bc4cca03384f20f5e36c7527efc8d1ad48a617b70c2cb1b38` |
| `go-study.jpg` | `5804f047-image.jpg` | 736×1308 | `27f48cbabe1d9ad12d004aeebc4035b364343cf2cc88135580edf24b96ebcd1b` |
| `content.jpg` | `a304ffc0-image.jpg` | 512×512 | `3ca83c99081ce48f9c0d9236253ad5d3abf9fe4b51c2c87eba010a4679f3b008` |
| `confused.jpg` | `b9f31ef6-image.jpg` | 512×512 | `fcd09fd955d774035f988b19be15a0bfbc47f6b88769689c683ff9bf1ea97230` |
| `overwhelmed-blur.jpg` | `0a73f211-image.jpg` | 345×345 | `a28cfe9991c5e1ef4403ea0e6351bd7b201ec9866b169ef0f59a9362f1d4fec8` |
| `slay.jpg` | `2688b92d-image.jpg` | 720×717 | `81d2d12ae678e7ab5b985b974f779780ad5d2cae30616f246b47064a687d429d` |
| `unimpressed.jpg` | `c3ba0b68-image.jpg` | 512×512 | `6d6edfa6ad613f88b79280121912f037e2fd27072733a032554826e386f7e5c4` |
| `ok-sign.jpg` | `4f3b27e6-image.jpg` | 720×710 | `d002f71281ecc849705f06b0a3dadad92d6cafb32948dd51b38f2ea6fd1d3376` |
| `grinning-pointing.jpg` | `a2d3cdb8-image.jpg` | 696×568 | `d47f33ffddaf61d9e674d7fdeb80aa1df34cef1d34118293ae01dcea24860562` |
| `thumbs-up.jpg` | `ced0b0d7-image.jpg` | 736×736 | `9f69e39398ef8188ab046bd7f91a455d744b1245739bd2068a72e77fe26ad400` |

Renaming changes no bytes. The upload names carry no meaning for a future reader,
so the files are named for what they show; the table is what ties each one back
to what was supplied.

To re-verify at any point:

```sh
sha256sum public/flork/*.jpg
```

## No affiliation with the IAPP

The artwork is **not an IAPP asset**. It is not affiliated with, endorsed by,
sponsored by, or approved by the IAPP, and it is not official AIGP or IAPP
material. The certification body has no relationship to this artwork and does not
own it.

The product's existing IAPP disclaimer (`src/components/app/disclaimer.tsx`) is
unrelated to this folder and is untouched by it.

## Licensing

The licensing position is the project owner's determination and is recorded in
`docs/notes/flork-licensing.md` as a note, not as a claim made by this repository.

## Format: JPEG, unchanged

This breaks the repo's `.webp` convention deliberately. Converting would
re-encode, and the served file would then no longer be the supplied file. Both
deploy targets set `output: "export"`, which disables the image optimizer, so
committed bytes are served bytes — 380 KB across twelve files, which does not
justify trading away that property.

Every file is RGB with **no alpha channel**, black line art on a white or
near-white ground. `FlorkArt` renders each on an explicit white plate in both
themes for that reason; the component's own comment explains why the
alternatives were rejected.
