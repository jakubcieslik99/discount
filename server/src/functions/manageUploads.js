import createError from 'http-errors'
import fs from 'fs'
import path from 'path'

//directory related promises
const createDirectory = folder => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path.join(__dirname, `/../../uploads/${folder}`), { recursive: true }, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

const removeDirectory = folder => {
  return new Promise((resolve, reject) => {
    fs.rm(path.join(__dirname, `/../../uploads/${folder}`), { recursive: true }, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

//files related promises
const getFiles = folder => {
  return new Promise((resolve, reject) => {
    fs.readdir(path.join(__dirname, `/../../uploads/${folder}`), (err, files) => {
      if (err) reject(err)
      else resolve(files)
    })
  })
}

const saveFile = (upload, path) => {
  return new Promise((resolve, reject) => {
    upload.mv(path, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

const removeFile = (folder, file) => {
  return new Promise((resolve, reject) => {
    fs.rm(path.join(__dirname, `/../../uploads/${folder}/${file}`), err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

//files related functions
const saveFiles = async (uploads, folder) => {
  const uploaded = []
  for (let file of uploads) {
    const filename = `${Date.now()}-${file.name}`
    const filepath = path.join(__dirname, `/../../uploads/${folder}/`, filename)

    await saveFile(file, filepath)

    uploaded.push(filename)
  }

  return uploaded
}

const filterFiles = async (modifiedFiles, uploads, folder) => {
  const originalFiles = await getFiles(folder)

  modifiedFiles.forEach(file => {
    if (!originalFiles.includes(file)) throw createError(422, 'Przesłano błędne dane.')
  })

  for (let file of originalFiles) if (!modifiedFiles.includes(file)) await removeFile(folder, file)

  const uploaded = modifiedFiles
  for (let file of uploads) {
    const filename = `${Date.now()}-${file.name}`
    const filepath = path.join(__dirname, `/../../uploads/${folder}/`, filename)

    await saveFile(file, filepath)

    uploaded.push(filename)
  }

  return uploaded
}

export { createDirectory, removeDirectory, saveFiles, filterFiles }
