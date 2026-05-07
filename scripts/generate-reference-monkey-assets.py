from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REFERENCE = Path(
    "/Users/yzend/.codex/generated_images/019e0331-24ff-7cf2-a694-9909b887b4e4/"
    "ig_00dea59e8224197d0169fcc072e0b88191a342ef76d51075d6.png"
)
OUT = ROOT / "public/assets"
FRAME = 314


def main() -> None:
    source = Image.open(REFERENCE).convert("RGBA")
    cells = crop_cells(source)

    write_sheet(
        "pets/monkey/monkey-idle.png",
        [cells["idle"], cells["blink"], cells["idle"], cells["blink"]],
    )
    write_sheet(
        "pets/monkey/monkey-happy.png",
        [cells["happy_jump"], cells["wave"], cells["sparkle"], cells["happy_jump"]],
    )
    write_sheet("pets/monkey/monkey-sad.png", [cells["sad"], cells["sad"]])
    write_sheet("pets/monkey/monkey-sick.png", [cells["sick"], cells["sick"]])
    write_sheet(
        "pets/monkey/monkey-sleep-scene.png",
        [cells["sleep_bed"], cells["sleep_bed"], cells["sleep_bed"], cells["sleep_bed"]],
    )
    write_sheet(
        "pets/monkey/monkey-eat.png",
        [cells["eat_1"], cells["eat_2"], cells["eat_1"], cells["eat_2"]],
    )
    write_sheet(
        "pets/monkey/monkey-clean.png",
        [cells["clean"], cells["clean"], cells["clean"], cells["clean"]],
    )
    write_sheet(
        "pets/monkey/monkey-play.png",
        [cells["toy"], cells["wave"], cells["happy_jump"], cells["toy"]],
    )
    write_sheet("pets/monkey/monkey-dead.png", [cells["dead"]])
    write_monkey_manifest()


def crop_cells(source: Image.Image) -> dict[str, Image.Image]:
    names = {
        (0, 0): "idle",
        (1, 0): "blink",
        (2, 0): "happy_jump",
        (3, 0): "sad",
        (0, 1): "angry",
        (1, 1): "sick",
        (2, 1): "sleep_floor",
        (3, 1): "sleep_bed",
        (0, 2): "eat_1",
        (1, 2): "eat_2",
        (2, 2): "toy",
        (3, 2): "clean",
        (0, 3): "wave",
        (1, 3): "stand",
        (2, 3): "sparkle",
        (3, 3): "dead",
    }
    x_bounds = [round(index * source.width / 4) for index in range(5)]
    y_bounds = [round(index * source.height / 4) for index in range(5)]
    cells: dict[str, Image.Image] = {}

    for row in range(4):
        for col in range(4):
            crop = source.crop(
                (
                    x_bounds[col] + 2,
                    y_bounds[row] + 2,
                    x_bounds[col + 1] - 2,
                    y_bounds[row + 1] - 2,
                )
            )
            cells[names[(col, row)]] = normalize_cell(remove_connected_background(crop))

    return cells


def normalize_cell(cell: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - cell.width) // 2
    y = (FRAME - cell.height) // 2
    canvas.alpha_composite(cell, (x, y))
    return canvas


def remove_connected_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        if not is_background_like(pixels[x, y]):
            continue

        pixels[x, y] = (0, 0, 0, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x < width - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < height - 1:
            queue.append((x, y + 1))

    return image


def is_background_like(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, alpha = pixel
    if alpha == 0:
        return True
    spread = max(r, g, b) - min(r, g, b)
    luminance = (r * 299 + g * 587 + b * 114) / 1000
    return luminance > 92 and spread < 72


def write_sheet(path: str, frames: list[Image.Image]) -> None:
    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME, 0))
    file = OUT / path
    file.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(file)


def write_monkey_manifest() -> None:
    def anim(
        image: str,
        frames: int,
        fps: int,
        loop: bool = True,
        offset_x: int = 0,
        offset_y: int = 0,
    ) -> dict[str, object]:
        return {
            "image": image,
            "frameWidth": FRAME,
            "frameHeight": FRAME,
            "frames": frames,
            "fps": fps,
            "loop": loop,
            "anchor": {"x": 0.5, "y": 1},
            "offset": {"x": offset_x, "y": offset_y},
        }

    animations = {
        "egg_idle": {
            **anim("/assets/pets/egg/egg-idle.png", 2, 2, True, 0, -29),
            "frameWidth": 64,
            "frameHeight": 64,
        },
        "egg_hatch": {
            **anim("/assets/pets/egg/egg-crack.png", 6, 8, False, 0, -29),
            "frameWidth": 64,
            "frameHeight": 64,
        },
        "baby_idle": anim("/assets/pets/monkey/monkey-idle.png", 4, 4),
        "baby_happy": anim("/assets/pets/monkey/monkey-happy.png", 4, 6),
        "baby_sad": anim("/assets/pets/monkey/monkey-sad.png", 2, 3),
        "child_idle": anim("/assets/pets/monkey/monkey-idle.png", 4, 4),
        "child_happy": anim("/assets/pets/monkey/monkey-happy.png", 4, 6),
        "child_sad": anim("/assets/pets/monkey/monkey-sad.png", 2, 3),
        "adult_idle": anim("/assets/pets/monkey/monkey-idle.png", 4, 4),
        "adult_happy": anim("/assets/pets/monkey/monkey-happy.png", 4, 6),
        "adult_sad": anim("/assets/pets/monkey/monkey-sad.png", 2, 3),
        "pet_eat": anim("/assets/pets/monkey/monkey-eat.png", 4, 7, False),
        "pet_play": anim("/assets/pets/monkey/monkey-play.png", 4, 7, False),
        "pet_clean": anim("/assets/pets/monkey/monkey-clean.png", 4, 7, False),
        "pet_sleep": anim("/assets/pets/monkey/monkey-sleep-scene.png", 4, 2),
        "pet_sick": anim("/assets/pets/monkey/monkey-sick.png", 2, 4),
        "pet_dead": anim("/assets/pets/monkey/monkey-dead.png", 1, 1, False),
    }
    manifest = {
        "id": "monkey",
        "frameSize": FRAME,
        "palette": "lcd-olive-reference",
        "animations": animations,
    }
    file = OUT / "pets/monkey/monkey.json"
    file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
