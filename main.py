import re

def define_env(env):
  "Hook function"

  @env.macro
  def k8spgjira(bugnumber):
      return '[K8SPG-'+str(bugnumber)+'](https://jira.percona.com/browse/K8SPG-'+str(bugnumber)+')'
  @env.macro
  def cloudjira(bugnumber):
      return '[CLOUD-'+str(bugnumber)+'](https://jira.percona.com/browse/CLOUD-'+str(bugnumber)+')'
  @env.macro
  def optionlink(optionname, optionprefix=''):
      linkname=optionname.replace('.', '-').lower()
      linkname=re.sub('&lt;.*?&gt;-', '', linkname)
      if (optionprefix != ''):
        optionprefix+='-'
      return '<a name=\"'+optionprefix+linkname+'\"></a> ['+optionname+'](#'+optionprefix+linkname+')'
