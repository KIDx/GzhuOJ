#include <unistd.h>
#include <sys/wait.h>
#include <cstdlib>
int main()
{
	if (fork()>0) return 0;
	pid_t OJpid;
	while (true) {
		OJpid = fork();
		if (OJpid == 0) {
			execlp("node", "node", "GzhuOJ/app", NULL);
			exit(-1);
		} else if (OJpid > 0) {
			waitpid(OJpid, NULL, 0);
		}
	}
}