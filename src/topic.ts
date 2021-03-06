import { ICommandInfo } from './command'

export interface ITopics {
  [k: string]: INestedTopic
}

export interface INestedTopic {
  description?: string
  subtopics?: ITopics
  commands?: { [k: string]: ICommandInfo }
  hidden?: boolean
}

export interface ITopic extends INestedTopic {
  name: string
}

function topicOf(id: string): string {
  if (!id) return ''
  return id
    .split(':')
    .slice(0, -1)
    .join(':')
}

function keyOf(id: string): string {
  if (!id) return ''
  return id
    .split(':')
    .slice(-1)
    .join(':')
}

export class TopicBase {
  public subtopics: { [k: string]: Topic } = {}
  public commands: { [k: string]: ICommandInfo } = {}

  public findTopic(id: string): Topic | undefined {
    let key = keyOf(id)
    let parentID = topicOf(id)
    if (parentID) {
      let parent = this.findTopic(parentID)
      return parent && parent.subtopics[key]
    }
    return this.subtopics[key]
  }

  public findCommand(id: string): ICommandInfo | undefined {
    const topic = this.findTopic(topicOf(id))
    if (topic) return topic.findCommand(id)
    return this.commands[keyOf(id)]
  }
}

export class Topic extends TopicBase implements ITopic {
  public name: string
  public description?: string
  public hidden: boolean

  constructor(opts: ITopic) {
    super()
    this.name = opts.name
    this.description = opts.description
    this.hidden = !!opts.hidden
    this.commands = opts.commands || {}
  }
}

export function topicsToArray(input: ITopic[] | ITopics | undefined): ITopic[]
export function topicsToArray(input: ITopics | undefined, base: string): ITopic[]
export function topicsToArray(input: ITopic[] | ITopics | undefined, base?: string): ITopic[] {
  if (!input) return []
  if (Array.isArray(input)) return input
  base = base ? `${base}:` : ''
  return Object.keys(input).map(k => new Topic({ ...input[k], name: `${base}${k}` }))
}

export function commandsToArray(input: ICommandInfo[] | { [k: string]: ICommandInfo } | undefined): ICommandInfo[]
export function commandsToArray(input: { [k: string]: ICommandInfo } | undefined, base: string): ICommandInfo[]
export function commandsToArray(
  input: ICommandInfo[] | { [k: string]: ICommandInfo } | undefined,
  base?: string,
): ICommandInfo[] {
  if (!input) return []
  if (Array.isArray(input)) return input
  base = base ? `${base}:` : ''
  return Object.keys(input).map(k => input[k])
}

export class RootTopic extends TopicBase {
  public subtopics: { [k: string]: Topic } = {}
  public commands: { [k: string]: ICommandInfo } = {}
  public allCommands: ICommandInfo[] = []
  public allTopics: Topic[] = []

  public findCommand(id: string) {
    for (let c of this.allCommands) {
      if (c.aliases.find(a => a === id)) return c
    }
    return super.findCommand(id)
  }

  public addTopics(topics: ITopic[] | { [k: string]: ITopic } | undefined) {
    for (let t of topicsToArray(topics)) {
      if (!t.name) continue
      let topic = this.findOrCreateTopic(t.name)
      this.mergeTopics(topic, t)
      this.addTopics(topicsToArray(t.subtopics, t.name))
      this.addCommands(commandsToArray(t.commands, t.name))
    }
  }

  public addCommands(commands: ICommandInfo[] | undefined) {
    if (!commands) return
    for (const c of commands) {
      this.allCommands.push(c)
      let topicID = topicOf(c.id)
      let topic = topicID ? this.findOrCreateTopic(topicID) : this
      topic.commands[keyOf(c.id)] = c
    }
  }

  private findOrCreateTopic(name: string): Topic {
    let key = keyOf(name)
    let parentID = topicOf(name)
    let topic: TopicBase = this
    if (parentID) {
      let parent = this.findOrCreateTopic(parentID)
      topic = parent
    }
    let topics = topic.subtopics
    if (!topics[key]) {
      topics[key] = new Topic({ name })
      this.allTopics.push(topics[key])
    }
    return topics[key]
  }

  private mergeTopics(a: Topic, b: ITopic) {
    a.description = b.description || a.description
    a.hidden = b.hidden || a.hidden
  }
}
