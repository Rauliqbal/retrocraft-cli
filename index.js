#!/usr/bin/env node
import { promisify } from 'util'
import { exec as _exec } from 'child_process'
import { join } from 'path'
import inquirer from 'inquirer'
import { rm as _rm, existsSync, mkdirSync, rmSync } from 'fs'
import ora from 'ora'
import chalk from 'chalk'

const exec = promisify(_exec)
const rm = promisify(_rm)
const date = new Date()

let projectPath = ''

process.on('SIGINT', () => {
  if (projectPath && existsSync(projectPath)) {
    rmSync(projectPath, { recursive: true, force: true })
    console.log(chalk.red('\n🧹 Folder project sementara dihapus.'))
  }
  console.log(
    chalk.yellowBright('❌ Proses dibatalkan oleh pengguna (Ctrl + C).')
  )
  process.exit(0)
})

// ASCII ART
const asciiArt = `
  ╔═══╗──╔╗─────╔═══╗─────╔═╦╗
  ║╔═╗║─╔╝╚╗────║╔═╗║─────║╔╝╚╗
  ║╚═╝╠═╩╗╔╬═╦══╣║─╚╬═╦══╦╝╚╗╔╝
  ║╔╗╔╣║═╣║║╔╣╔╗║║─╔╣╔╣╔╗╠╗╔╣║
  ║║║╚╣║═╣╚╣║║╚╝║╚═╝║║║╔╗║║║║╚╗
  ╚╝╚═╩══╩═╩╝╚══╩═══╩╝╚╝╚╝╚╝╚═╝
`

// const greet = `

//                  ©Azuracoder ${date.getFullYear()}, Build Modern Frontends, Code the Future
// `

const question = [
  {
    type: 'input',
    name: 'project-name',
    message: 'What is the name of your new project?',
    default: 'my-project',
    validate: (value) => {
      if (value.includes(' ')) {
        return 'Project name cannot contain spaces.'
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
        return 'Only letters, numbers, dashes (-), and underscores (_) are allowed.'
      }
      return true
    },
  },
  {
    type: 'list',
    name: 'project-template',
    message: 'Pick your frontend stack of choice:',
    choices: ['NextJS', 'NuxtJS', 'ReactJS', 'VueJS', 'MERN', 'MEVN'],
  },
  {
    type: 'list',
    name: 'package-manager',
    message: 'Choose your weapon (package manager):',
    choices: ['npm', 'pnpm', 'bun'],
  },
]

console.log(chalk.blue(asciiArt))
console.log(chalk.greenBright.bold(greet))

// ✅ Bungkus prompt dan proses utama dalam try-catch
const main = async () => {
  try {
    const answers = await inquirer.prompt(question)
    const projectName = answers['project-name']
    const projectTemplate = answers['project-template']
    const projectPackageManager = answers['package-manager']
    const currentPath = process.cwd()
    projectPath = join(currentPath, projectName)

    if (existsSync(projectPath)) {
      console.log(
        chalk.redBright(
          '🚫 A project with this name already exists. Please pick a unique name.'
        )
      )
      process.exit(1)
    } else {
      mkdirSync(projectPath)
    }

    // Clone Project
    const gitLoading = ora('📡 Downloading boilerplate... Please wait.').start()
    await exec(
      `git clone --depth 1 https://github.com/Rauliqbal/${projectTemplate}-boilerplate.git ${projectPath} --quiet`
    )
    gitLoading.succeed()

    // Setup Directory
    const setupLoading = ora('🛠️  Setting up your project...').start()
    const rmGit = rm(join(projectPath, '.git'), {
      recursive: true,
      force: true,
    })
    const rmLicense = rm(join(projectPath, 'LICENSE'), {
      recursive: true,
      force: true,
    })
    const rmLock = rm(join(projectPath, 'package-lock.json'), {
      recursive: true,
      force: true,
    })
    await Promise.all([rmGit, rmLicense, rmLock])
    process.chdir(projectPath)
    setupLoading.succeed()

    // Install Dependencies
    const installLoading = ora('📦 Installing dependencies...').start()
    await exec(`${projectPackageManager} install`)
    installLoading.succeed()

    console.log(chalk.greenBright('\n✅ Your project is ready to rock!'))
    console.log(chalk.gray('\nGet started with:'))
    console.log(chalk.cyan(`  cd ${projectName}`))
    console.log(chalk.cyan(`  ${projectPackageManager} run dev\n`))
    console.log(chalk.magentaBright('✨ Happy hacking! ✨'))
  } catch (error) {
    if (
      error.isTtyError ||
      error.message?.includes('force closed the prompt')
    ) {
      console.log(chalk.yellowBright('\n⚠️  Prompt cancelled.'))
    } else {
      console.error(chalk.red('❌ An error occurred in the CLI:'), error)
    }

    if (projectPath && existsSync(projectPath)) {
      rmSync(projectPath, { recursive: true, force: true })
    }

    process.exit(0)
  }
}

main()
